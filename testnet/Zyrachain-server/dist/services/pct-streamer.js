"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPctStreamer = startPctStreamer;
const axios_1 = __importDefault(require("axios"));
const mongoose_1 = __importDefault(require("mongoose"));
const pct_summary_1 = require("./pct-summary");
const snapshots_1 = require("./snapshots");
const redisMemoryCache_1 = require("./redisMemoryCache");
const STREAM_ID = 'main';
const OWNER_ID = `pct-streamer-${process.pid}`;
const PI_ADDR = /^G[A-Z2-7]{55}$/;
let timer = null;
let inFlight = false;
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
function leaseMs() {
    return Number(process.env.PCT_STREAM_LEASE_MS || 60000);
}
function pollMs() {
    return Number(process.env.PCT_STREAM_POLL_MS || 15000);
}
function backfillConcurrency() {
    return Math.max(1, Math.min(20, Number(process.env.PCT_STREAM_BACKFILL_CONCURRENCY || 6)));
}
function backfillBatchSize() {
    return Math.max(0, Math.min(2000, Number(process.env.PCT_STREAM_BACKFILL_BATCH_SIZE || 1000)));
}
function balanceRefreshIntervalMs() {
    return Math.max(60000, Number(process.env.PCT_BALANCE_REFRESH_MS || 300000));
}
function createClient() {
    const primary = horizonBase();
    const fallback = horizonFallback();
    const client = axios_1.default.create({
        baseURL: primary,
        timeout: Number(process.env.PCT_HORIZON_TIMEOUT_MS || 12000),
        headers: { Accept: 'application/json' },
    });
    client.interceptors.response.use((response) => response, async (error) => {
        const cfg = error?.config;
        if (!cfg)
            return Promise.reject(error);
        const status = error?.response?.status;
        if (status === 429 || (status && status >= 500)) {
            const retries = (cfg.__retries || 0) + 1;
            if (retries > 3)
                return Promise.reject(error);
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
        return Promise.reject(error);
    });
    return client;
}
const client = createClient();
async function ensureState() {
    const col = mongoose_1.default.connection.collection('pct-stream-state');
    const existing = (await col.findOne({ _id: STREAM_ID }));
    if (existing) {
        await col.updateOne({ _id: STREAM_ID }, [
            {
                $set: {
                    backfillIndex: { $ifNull: ['$backfillIndex', 0] },
                    backfillTotal: { $ifNull: ['$backfillTotal', null] },
                    lastError: { $ifNull: ['$lastError', null] },
                },
            },
        ]);
        return (await col.findOne({ _id: STREAM_ID }));
    }
    const seed = {
        _id: STREAM_ID,
        cursor: 'now',
        leaseOwner: null,
        leaseExpiresAt: null,
        backfilledAt: null,
        backfillIndex: 0,
        backfillTotal: null,
        lastEventAt: null,
        lastRunAt: null,
        lastError: null,
    };
    await col.insertOne(seed);
    return seed;
}
async function acquireLease() {
    const now = new Date();
    const until = new Date(now.getTime() + leaseMs());
    const col = mongoose_1.default.connection.collection('pct-stream-state');
    const r = await col.updateOne({
        _id: STREAM_ID,
        $or: [
            { leaseOwner: null },
            { leaseExpiresAt: null },
            { leaseExpiresAt: { $lt: now } },
            { leaseOwner: OWNER_ID },
        ],
    }, {
        $set: {
            leaseOwner: OWNER_ID,
            leaseExpiresAt: until,
        },
    });
    return r.modifiedCount === 1;
}
async function releaseLease() {
    const col = mongoose_1.default.connection.collection('pct-stream-state');
    await col.updateOne({ _id: STREAM_ID, leaseOwner: OWNER_ID }, { $set: { leaseOwner: null, leaseExpiresAt: null } });
}
async function loadTrackedWallets() {
    const coreCol = mongoose_1.default.connection.collection('core-team-addresses');
    const cexCol = mongoose_1.default.connection.collection('cex-addresses');
    const [coreDocs, cexDocs] = await Promise.all([
        coreCol.find({}).project({ identifier: 1 }).toArray(),
        cexCol.find({}).project({ identifier: 1 }).toArray(),
    ]);
    const coreSet = new Set(coreDocs
        .map((d) => (typeof d.identifier === 'string' ? d.identifier.trim() : ''))
        .filter((id) => PI_ADDR.test(id)));
    const cexSet = new Set(cexDocs
        .map((d) => (typeof d.identifier === 'string' ? d.identifier.trim() : ''))
        .filter((id) => PI_ADDR.test(id)));
    const trackedSet = new Set([...coreSet, ...cexSet]);
    return { coreSet, cexSet, trackedSet };
}
async function fetchBalance(identifier) {
    try {
        const { data } = await client.get(`/accounts/${encodeURIComponent(identifier)}`);
        const native = data.balances?.find((b) => b.asset_type === 'native');
        return native ? Number(native.balance) || 0 : 0;
    }
    catch {
        return 0;
    }
}
async function runBackfill(state, coreSet, cexSet, trackedSet) {
    if (state.backfilledAt && process.env.PCT_STREAM_FORCE_BACKFILL !== 'true')
        return;
    const ids = [...trackedSet];
    const total = ids.length;
    const streamStateCol = mongoose_1.default.connection.collection('pct-stream-state');
    const stateCol = mongoose_1.default.connection.collection('pct-wallet-state');
    if (total === 0) {
        await streamStateCol.updateOne({ _id: STREAM_ID }, { $set: { backfilledAt: new Date(), backfillTotal: 0, backfillIndex: 0 } });
        return;
    }
    const batch = backfillBatchSize();
    const startIndex = Math.max(0, Number(state.backfillIndex ?? 0));
    const endIndex = Math.min(total, startIndex + (batch || total));
    const slice = batch > 0 ? ids.slice(startIndex, endIndex) : ids;
    const workers = new Array(Math.min(backfillConcurrency(), slice.length)).fill(0);
    let idx = 0;
    await Promise.all(workers.map(async () => {
        while (idx < slice.length) {
            const i = idx++;
            const identifier = slice[i];
            const balance = await fetchBalance(identifier);
            await stateCol.updateOne({ identifier }, {
                $set: {
                    identifier,
                    lastBalance: balance,
                    lastCheckedAt: new Date(),
                    backfilledByStreamAt: new Date(),
                },
                $setOnInsert: {
                    firstSeenBalance: balance,
                    firstSeenAt: new Date(),
                },
            }, { upsert: true });
        }
    }));
    await streamStateCol.updateOne({ _id: STREAM_ID }, { $set: { backfillTotal: total, backfillIndex: endIndex } });
    if (batch > 0 && endIndex < total)
        return;
    const trackedIds = [...trackedSet];
    const coreIds = [...coreSet];
    const cexIds = [...cexSet];
    const [baselineTrackedAgg, baselineCoreAgg, baselineCexAgg] = await Promise.all([
        trackedIds.length
            ? stateCol
                .aggregate([
                { $match: { identifier: { $in: trackedIds } } },
                { $group: { _id: null, total: { $sum: '$lastBalance' } } },
            ])
                .toArray()
            : Promise.resolve([]),
        coreIds.length
            ? stateCol
                .aggregate([
                { $match: { identifier: { $in: coreIds } } },
                { $group: { _id: null, total: { $sum: '$lastBalance' } } },
            ])
                .toArray()
            : Promise.resolve([]),
        cexIds.length
            ? stateCol
                .aggregate([
                { $match: { identifier: { $in: cexIds } } },
                { $group: { _id: null, total: { $sum: '$lastBalance' } } },
            ])
                .toArray()
            : Promise.resolve([]),
    ]);
    const baselineTracked = typeof baselineTrackedAgg[0]?.total === 'number' ? baselineTrackedAgg[0].total : 0;
    const baselineCore = typeof baselineCoreAgg[0]?.total === 'number' ? baselineCoreAgg[0].total : 0;
    const baselineCex = typeof baselineCexAgg[0]?.total === 'number' ? baselineCexAgg[0].total : 0;
    const metaCol = mongoose_1.default.connection.collection('pct-monitor-meta');
    await metaCol.updateOne({ _id: 'meta' }, {
        $set: {
            baselineSumPiCore: baselineCore,
            baselineSumPiCex: baselineCex,
            baselineSumPiTracked: baselineTracked,
            lastFullScanAt: new Date(),
            scanLock: false,
            scanStartedAt: null,
        },
    }, { upsert: true });
    await streamStateCol.updateOne({ _id: STREAM_ID }, { $set: { backfilledAt: new Date() } });
    await (0, pct_summary_1.refreshPctSummary)();
}
async function runBalanceRefresh(trackedSet) {
    const ids = [...trackedSet];
    if (ids.length === 0)
        return;
    const stateCol = mongoose_1.default.connection.collection('pct-wallet-state');
    const streamStateCol = mongoose_1.default.connection.collection('pct-stream-state');
    const workers = new Array(Math.min(backfillConcurrency(), ids.length)).fill(0);
    let idx = 0;
    await Promise.all(workers.map(async () => {
        while (idx < ids.length) {
            const i = idx++;
            const identifier = ids[i];
            const balance = await fetchBalance(identifier);
            await stateCol.updateOne({ identifier }, {
                $set: { identifier, lastBalance: balance, lastCheckedAt: new Date() },
                $setOnInsert: { firstSeenBalance: balance, firstSeenAt: new Date() },
            }, { upsert: true });
        }
    }));
    await streamStateCol.updateOne({ _id: STREAM_ID }, { $set: { lastBalanceRefreshAt: new Date() } });
    await (0, pct_summary_1.refreshPctSummary)();
}
async function runOneCycle() {
    await ensureState();
    const gotLease = await acquireLease();
    if (!gotLease)
        return;
    try {
        const streamStateCol = mongoose_1.default.connection.collection('pct-stream-state');
        await streamStateCol.updateOne({ _id: STREAM_ID, leaseOwner: OWNER_ID }, { $set: { lastRunAt: new Date(), lastError: null } });
        const state = await streamStateCol.findOne({ _id: STREAM_ID });
        if (!state)
            return;
        const { coreSet, cexSet, trackedSet } = await loadTrackedWallets();
        await runBackfill(state, coreSet, cexSet, trackedSet);
        const params = {
            cursor: state.cursor || 'now',
            order: 'asc',
            limit: Math.max(20, Math.min(200, Number(process.env.PCT_STREAM_LIMIT || 100))),
            join: 'transactions',
        };
        const { data } = await client.get('/payments', { params });
        const records = data._embedded?.records ?? [];
        const eventsCol = mongoose_1.default.connection.collection('pct-balance-events');
        const movementsCol = mongoose_1.default.connection.collection('pct-wallet-movements');
        const stateCol = mongoose_1.default.connection.collection('pct-wallet-state');
        let cursor = state.cursor || 'now';
        const eventDocs = [];
        const stateOps = [];
        const movementOps = [];
        for (const row of records) {
            const type = typeof row.type === 'string' ? row.type : '';
            const assetType = typeof row.asset_type === 'string' ? row.asset_type : '';
            const from = typeof row.from === 'string' ? row.from : '';
            const to = typeof row.to === 'string' ? row.to : '';
            const amount = Number(row.amount || 0);
            const pagingToken = String(row.paging_token || row.id || '');
            const txHash = typeof row.transaction_hash === 'string' ? row.transaction_hash : null;
            const detectedAt = typeof row.created_at === 'string' ? new Date(row.created_at) : new Date();
            if (pagingToken)
                cursor = pagingToken;
            if (type !== 'payment' || assetType !== 'native' || amount <= 0)
                continue;
            if (trackedSet.has(from)) {
                eventDocs.push({
                    wallet: from,
                    oldBalance: null,
                    newBalance: null,
                    change: -Math.abs(amount),
                    detectedAt,
                    ledger: pagingToken ? Number(pagingToken.split('-')[0]) || null : null,
                    transactionHash: txHash,
                    source: 'stream',
                });
                stateOps.push({
                    updateOne: {
                        filter: { identifier: from },
                        update: {
                            $inc: { lastBalance: -Math.abs(amount) },
                            $set: { identifier: from, lastCheckedAt: detectedAt },
                        },
                        upsert: true,
                    },
                });
            }
            if (trackedSet.has(to)) {
                eventDocs.push({
                    wallet: to,
                    oldBalance: null,
                    newBalance: null,
                    change: Math.abs(amount),
                    detectedAt,
                    ledger: pagingToken ? Number(pagingToken.split('-')[0]) || null : null,
                    transactionHash: txHash,
                    source: 'stream',
                });
                stateOps.push({
                    updateOne: {
                        filter: { identifier: to },
                        update: {
                            $inc: { lastBalance: Math.abs(amount) },
                            $set: { identifier: to, lastCheckedAt: detectedAt },
                        },
                        upsert: true,
                    },
                });
            }
            if (trackedSet.has(from) && !trackedSet.has(to)) {
                movementOps.push({
                    updateOne: {
                        filter: { paymentId: String(row.id || pagingToken || `${txHash}:${to}:${amount}`) },
                        update: {
                            $setOnInsert: {
                                paymentId: String(row.id || pagingToken || `${txHash}:${to}:${amount}`),
                                wallet: from,
                                destination: to,
                                amount: Math.abs(amount),
                                detectedAt,
                                ledger: pagingToken ? Number(pagingToken.split('-')[0]) || null : null,
                                transactionHash: txHash,
                                createdAt: new Date(),
                                source: 'stream',
                            },
                        },
                        upsert: true,
                    },
                });
            }
        }
        if (eventDocs.length > 0) {
            try {
                await eventsCol.insertMany(eventDocs, { ordered: false });
            }
            catch (err) {
                if (err.code !== 11000)
                    throw err;
            }
            const cexEventCount = eventDocs.filter((e) => cexSet.has(String(e.wallet))).length;
            if (cexEventCount > 0) {
                try {
                    await (0, snapshots_1.buildCexFlows)();
                    await (0, snapshots_1.buildHomePulse)();
                    await Promise.all([
                        (0, redisMemoryCache_1.cacheDel)((0, redisMemoryCache_1.cacheKeySegment)('cex-flows')),
                        (0, redisMemoryCache_1.cacheDel)((0, redisMemoryCache_1.cacheKeySegment)('pulse')),
                    ]);
                }
                catch (refreshErr) {
                    console.error('[pct-streamer] CEX snapshot refresh failed:', refreshErr);
                }
            }
        }
        if (movementOps.length > 0) {
            try {
                await movementsCol.bulkWrite(movementOps, { ordered: false });
            }
            catch (err) {
                if (err.code !== 11000)
                    throw err;
            }
        }
        if (stateOps.length > 0) {
            await stateCol.bulkWrite(stateOps, { ordered: false });
        }
        await streamStateCol.updateOne({ _id: STREAM_ID }, {
            $set: {
                cursor,
                lastEventAt: records.length > 0 ? new Date() : state.lastEventAt,
                lastRunAt: new Date(),
            },
        });
        const metaCol = mongoose_1.default.connection.collection('pct-monitor-meta');
        await metaCol.updateOne({ _id: 'meta' }, { $set: { lastFullScanAt: new Date(), scanLock: false } }, { upsert: true });
        await (0, pct_summary_1.refreshPctSummary)();
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        try {
            const streamStateCol = mongoose_1.default.connection.collection('pct-stream-state');
            await streamStateCol.updateOne({ _id: STREAM_ID }, { $set: { lastError: msg } });
        }
        catch {
        }
        throw error;
    }
    finally {
        await releaseLease();
    }
}
function startPctStreamer() {
    if (process.env.PCT_STREAM_ENABLED !== 'true')
        return;
    if (timer)
        return;
    console.log(`[pct-streamer] starting (poll=${pollMs()}ms, balanceRefresh=${balanceRefreshIntervalMs()}ms)`);
    const tick = async () => {
        if (inFlight)
            return;
        inFlight = true;
        try {
            await runOneCycle();
        }
        catch (error) {
            console.error('[pct-streamer] cycle failed:', error);
        }
        finally {
            inFlight = false;
        }
    };
    void tick();
    timer = setInterval(() => {
        void tick();
    }, Math.max(2000, pollMs()));
    let balanceRefreshing = false;
    setInterval(async () => {
        if (balanceRefreshing)
            return;
        balanceRefreshing = true;
        try {
            const { coreSet, cexSet, trackedSet } = await loadTrackedWallets();
            await runBalanceRefresh(trackedSet);
        }
        catch (e) {
            console.error('[pct-streamer] balance refresh failed:', e);
        }
        finally {
            balanceRefreshing = false;
        }
    }, Math.max(30000, balanceRefreshIntervalMs()));
}
//# sourceMappingURL=pct-streamer.js.map