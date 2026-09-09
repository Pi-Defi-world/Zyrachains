"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPctMeta = getPctMeta;
exports.tryAcquireScanLock = tryAcquireScanLock;
exports.releaseScanLock = releaseScanLock;
exports.runPctBalanceScan = runPctBalanceScan;
const mongoose_1 = __importDefault(require("mongoose"));
const axios_1 = __importDefault(require("axios"));
const metrics_1 = require("./metrics");
const pct_summary_1 = require("./pct-summary");
const PI_ADDRESS_PATTERN = /^G[A-Z2-7]{55}$/;
const META_ID = 'meta';
const LOCK_STALE_MS = Number(process.env.PCT_SCAN_LOCK_STALE_MS || 2 * 60 * 60 * 1000);
function horizonBase() {
    return (process.env.PCT_HORIZON_BASE_URL ||
        process.env.HORIZON_BASE_URL ||
        'https://api.mainnet.minepi.com').replace(/\/$/, '');
}
function horizonFallback() {
    return (process.env.HORIZON_FALLBACK_URL ||
        process.env.NEXT_PUBLIC_HORIZON_FALLBACK_URL ||
        'https://api.mainnet.minepi.com').replace(/\/$/, '');
}
function concurrency() {
    const n = Number(process.env.PCT_SCAN_CONCURRENCY || 8);
    return Math.min(32, Math.max(1, Number.isFinite(n) ? n : 8));
}
function delayMs() {
    const n = Number(process.env.PCT_SCAN_DELAY_MS || 80);
    return Math.min(5000, Math.max(0, Number.isFinite(n) ? n : 80));
}
function batchSize() {
    const n = Number(process.env.PCT_SCAN_BATCH_SIZE || 0);
    return Math.max(0, Number.isFinite(n) ? n : 0);
}
function createHorizonClient() {
    const fallback = horizonFallback();
    const client = axios_1.default.create({
        baseURL: horizonBase(),
        timeout: Number(process.env.PCT_HORIZON_TIMEOUT_MS || 12000),
        headers: { Accept: 'application/json' },
    });
    client.interceptors.response.use((response) => response, async (error) => {
        const cfg = error?.config;
        if (!cfg)
            throw error;
        const status = error?.response?.status;
        if (status === 429 || (status && status >= 500)) {
            const retries = (cfg.__retries || 0) + 1;
            if (retries > 3)
                throw error;
            const delay = status === 429
                ? Number(error.response?.headers?.['retry-after'] || 2) * 1000
                : Math.min(30000, 1000 * Math.pow(2, retries));
            await new Promise((r) => setTimeout(r, delay));
            return client.request({ ...cfg, __retries: retries });
        }
        const shouldFallback = !cfg.__fallbackTried &&
            fallback &&
            fallback !== cfg.baseURL &&
            typeof status !== 'number';
        if (shouldFallback) {
            return client.request({ ...cfg, baseURL: fallback, __fallbackTried: true });
        }
        throw error;
    });
    return client;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function fetchNativeBalance(client, identifier) {
    const attempts = Number(process.env.PCT_HORIZON_RETRY_ATTEMPTS || 5);
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const { data } = await client.get(`/accounts/${encodeURIComponent(identifier)}`);
            const native = data.balances?.find((b) => b.asset_type === 'native');
            const balance = native ? parseFloat(native.balance) : 0;
            const ledger = typeof data.last_modified_ledger === 'number' ? data.last_modified_ledger : null;
            return { balance, ledger };
        }
        catch (e) {
            const status = axios_1.default.isAxiosError(e) ? e.response?.status : undefined;
            if (status === 404 || status === 400) {
                return { balance: 0, ledger: null };
            }
            if (status === 429) {
                (0, metrics_1.inc)('pctScan.horizon429');
            }
            if ((status === 429 || (status && status >= 500)) && attempt < attempts) {
                const retryAfter = axios_1.default.isAxiosError(e)
                    ? Number(e.response?.headers?.['retry-after']) * 1000
                    : 0;
                const backoff = retryAfter || Math.min(30000, 1000 * Math.pow(2, attempt - 1));
                await sleep(backoff);
                continue;
            }
            console.warn(`[pct-scan] Horizon error for ${identifier.slice(0, 8)}…`, status || e);
            return null;
        }
    }
    return null;
}
async function fetchExternalOutPayments(client, wallet, pctSet, since) {
    try {
        const { data } = await client.get(`/accounts/${encodeURIComponent(wallet)}/payments`, {
            params: { order: 'desc', limit: Number(process.env.PCT_MOVEMENT_PAYMENT_LIMIT || 100) },
        });
        const rows = data._embedded?.records ?? [];
        return rows
            .filter((p) => {
            if (p.type !== 'payment' || p.asset_type !== 'native')
                return false;
            if (p.from !== wallet)
                return false;
            if (!p.to || pctSet.has(p.to))
                return false;
            if (since && p.created_at && new Date(p.created_at) <= since)
                return false;
            return true;
        })
            .map((p) => ({
            paymentId: String(p.id || p.paging_token || `${p.transaction_hash}:${p.to}:${p.amount}`),
            wallet,
            destination: String(p.to),
            amount: Math.abs(parseFloat(p.amount || '0')),
            detectedAt: p.created_at ? new Date(p.created_at) : new Date(),
            ledger: p.paging_token ? Number(String(p.paging_token).split('-')[0]) : null,
            transactionHash: p.transaction_hash || null,
        }))
            .filter((p) => p.amount > 0);
    }
    catch (e) {
        const status = axios_1.default.isAxiosError(e) ? e.response?.status : undefined;
        if (status !== 404 && status !== 400) {
            console.warn(`[pct-scan] payment lookup failed for ${wallet.slice(0, 8)}…`, status || e);
        }
        return [];
    }
}
async function mapPool(items, poolSize, worker) {
    let idx = 0;
    const runners = new Array(Math.min(poolSize, items.length)).fill(0).map(async () => {
        while (idx < items.length) {
            const i = idx++;
            await worker(items[i], i);
        }
    });
    await Promise.all(runners);
}
function metaCollection() {
    return mongoose_1.default.connection.collection('pct-monitor-meta');
}
async function getPctMeta() {
    return metaCollection().findOne({ _id: META_ID });
}
async function ensureMeta(col) {
    const existing = await col.findOne({ _id: META_ID });
    if (existing)
        return existing;
    const seed = {
        _id: META_ID,
        baselineSumPi: null,
        lastFullScanAt: null,
        scanLock: false,
        scanStartedAt: null,
    };
    await col.insertOne(seed);
    return seed;
}
async function maybeClearStaleLock(metaCol) {
    const meta = await metaCol.findOne({ _id: META_ID });
    if (!meta?.scanLock || !meta.scanStartedAt)
        return;
    const started = new Date(meta.scanStartedAt).getTime();
    if (Date.now() - started > LOCK_STALE_MS) {
        console.warn('[pct-scan] Clearing stale scan lock');
        await metaCol.updateOne({ _id: META_ID }, { $set: { scanLock: false, scanStartedAt: null } });
    }
}
async function tryAcquireScanLock() {
    const metaCol = metaCollection();
    await ensureMeta(metaCol);
    await maybeClearStaleLock(metaCol);
    const r = await metaCol.updateOne({ _id: META_ID, scanLock: { $ne: true } }, { $set: { scanLock: true, scanStartedAt: new Date() } });
    return r.modifiedCount === 1;
}
async function releaseScanLock() {
    await metaCollection().updateOne({ _id: META_ID }, { $set: { scanLock: false } });
}
async function runPctBalanceScan() {
    const started = Date.now();
    (0, metrics_1.inc)('pctScan.runs');
    const coreCol = mongoose_1.default.connection.collection('core-team-addresses');
    const stateCol = mongoose_1.default.connection.collection('pct-wallet-state');
    const eventsCol = mongoose_1.default.connection.collection('pct-balance-events');
    const movementsCol = mongoose_1.default.connection.collection('pct-wallet-movements');
    const metaCol = metaCollection();
    const acquired = await tryAcquireScanLock();
    if (!acquired) {
        return {
            ok: true,
            skipped: true,
            walletsProcessed: 0,
            walletsFailed: 0,
            eventsCreated: 0,
            movementsCreated: 0,
            durationMs: Date.now() - started,
        };
    }
    let eventsCreated = 0;
    let movementsCreated = 0;
    let walletsProcessed = 0;
    let walletsFailed = 0;
    try {
        await ensureMeta(metaCol);
        const raw = await coreCol.find({}).project({ identifier: 1 }).toArray();
        const identifiers = raw
            .map((d) => (typeof d.identifier === 'string' ? d.identifier.trim() : ''))
            .filter((id) => PI_ADDRESS_PATTERN.test(id));
        const unique = [...new Set(identifiers)];
        const pctSet = new Set(unique);
        const metaBeforeScan = await metaCol.findOne({ _id: META_ID });
        const isBaselineComplete = metaBeforeScan?.baselineSumPi !== null && metaBeforeScan?.baselineSumPi !== undefined;
        let scanTargets = unique;
        const maxBatch = batchSize();
        if (!isBaselineComplete) {
            const existingState = await stateCol
                .find({ identifier: { $in: unique } })
                .project({ identifier: 1 })
                .toArray();
            const seen = new Set(existingState.map((s) => String(s.identifier)));
            const missing = unique.filter((identifier) => !seen.has(identifier));
            scanTargets = missing.length > 0 ? missing : unique;
            if (missing.length === 0) {
                const sumAgg = await stateCol
                    .aggregate([{ $group: { _id: null, total: { $sum: '$lastBalance' } } }])
                    .toArray();
                await metaCol.updateOne({ _id: META_ID }, {
                    $set: {
                        baselineSumPi: sumAgg[0]?.total ?? 0,
                        lastFullScanAt: new Date(),
                        scanLock: false,
                        scanStartedAt: null,
                    },
                });
                await (0, pct_summary_1.refreshPctSummary)().catch((e) => console.warn('[pct-scan] summary refresh:', e));
                return {
                    ok: true,
                    walletsProcessed: 0,
                    walletsFailed: 0,
                    eventsCreated: 0,
                    movementsCreated: 0,
                    durationMs: Date.now() - started,
                };
            }
        }
        if (maxBatch > 0) {
            scanTargets = scanTargets.slice(0, maxBatch);
        }
        const client = createHorizonClient();
        const pool = concurrency();
        const pause = delayMs();
        await mapPool(scanTargets, pool, async (identifier) => {
            if (pause > 0)
                await new Promise((r) => setTimeout(r, pause));
            const fetched = await fetchNativeBalance(client, identifier);
            if (!fetched) {
                walletsFailed++;
                return;
            }
            walletsProcessed++;
            const prev = await stateCol.findOne({ identifier });
            const oldBal = prev && typeof prev.lastBalance === 'number' ? prev.lastBalance : null;
            const previousCheckedAt = prev?.lastCheckedAt instanceof Date
                ? prev.lastCheckedAt
                : prev?.lastCheckedAt
                    ? new Date(prev.lastCheckedAt)
                    : null;
            const now = new Date();
            await stateCol.updateOne({ identifier }, {
                $set: {
                    identifier,
                    lastBalance: fetched.balance,
                    lastLedger: fetched.ledger,
                    lastCheckedAt: now,
                    ...(oldBal === null
                        ? { firstSeenBalance: fetched.balance, firstSeenAt: now }
                        : {}),
                },
            }, { upsert: true });
            if (oldBal !== null && fetched.balance !== oldBal) {
                const change = fetched.balance - oldBal;
                try {
                    await eventsCol.insertOne({
                        wallet: identifier,
                        oldBalance: oldBal,
                        newBalance: fetched.balance,
                        change,
                        detectedAt: now,
                        ledger: fetched.ledger,
                        source: 'scan',
                    });
                    eventsCreated++;
                }
                catch (e) {
                    if (e.code !== 11000)
                        throw e;
                }
                if (change < 0) {
                    const movements = await fetchExternalOutPayments(client, identifier, pctSet, previousCheckedAt);
                    for (const movement of movements) {
                        const result = await movementsCol.updateOne({ paymentId: movement.paymentId }, {
                            $setOnInsert: {
                                ...movement,
                                createdAt: new Date(),
                            },
                        }, { upsert: true });
                        if (result.upsertedCount === 1)
                            movementsCreated++;
                    }
                }
            }
        });
        const sumAgg = await stateCol
            .aggregate([{ $group: { _id: null, total: { $sum: '$lastBalance' } } }])
            .toArray();
        const currentSum = sumAgg[0]?.total ?? 0;
        const stateCount = await stateCol.countDocuments({ identifier: { $in: unique } });
        const baselineComplete = stateCount >= unique.length;
        const meta = await metaCol.findOne({ _id: META_ID });
        const updates = {
            scanLock: false,
            scanStartedAt: null,
        };
        if (meta && meta.baselineSumPi === null && stateCount > 0 && unique.length > 0) {
            updates.baselineSumPi = currentSum;
        }
        if (stateCount >= unique.length * 0.8 || walletsFailed === 0) {
            updates.lastFullScanAt = new Date();
        }
        await metaCol.updateOne({ _id: META_ID }, { $set: updates });
        await (0, pct_summary_1.refreshPctSummary)().catch((e) => console.warn('[pct-scan] summary refresh:', e));
        (0, metrics_1.inc)('pctScan.walletsProcessed', walletsProcessed);
        (0, metrics_1.inc)('pctScan.walletsFailed', walletsFailed);
        (0, metrics_1.setGauge)('pctScan.durationMs', Date.now() - started);
        return {
            ok: true,
            walletsProcessed,
            walletsFailed,
            eventsCreated,
            movementsCreated,
            durationMs: Date.now() - started,
        };
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[pct-scan] Fatal:', msg);
        await releaseScanLock();
        (0, metrics_1.setGauge)('pctScan.durationMs', Date.now() - started);
        return {
            ok: false,
            walletsProcessed: 0,
            walletsFailed,
            eventsCreated,
            movementsCreated,
            durationMs: Date.now() - started,
            error: msg,
        };
    }
}
//# sourceMappingURL=pct-balance-scanner.js.map