"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSnapshotScheduler = startSnapshotScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const snapshots_1 = require("../services/snapshots");
function enabled() {
    return process.env.SNAPSHOT_CRON_ENABLED !== 'false';
}
function startSnapshotScheduler() {
    if (!enabled()) {
        console.log('[snapshotScheduler] disabled (SNAPSHOT_CRON_ENABLED=false)');
        return;
    }
    const running = new Set();
    const jitterMaxMs = Math.max(0, Number(process.env.SNAPSHOT_JITTER_MAX_MS || 1500));
    const randomJitter = () => (jitterMaxMs > 0 ? Math.floor(Math.random() * jitterMaxMs) : 0);
    const safe = (name, fn) => async () => {
        if (running.has(name)) {
            console.warn(`[snapshotScheduler] skip overlapping run for ${name}`);
            return;
        }
        running.add(name);
        try {
            const jitter = randomJitter();
            if (jitter > 0) {
                await new Promise((resolve) => setTimeout(resolve, jitter));
            }
            await fn();
        }
        catch (e) {
            console.error(`[snapshotScheduler] ${name}:`, e);
        }
        finally {
            running.delete(name);
        }
    };
    const heroMs = Number(process.env.SNAPSHOT_HERO_INTERVAL_MS || 60000);
    const fastMs = Number(process.env.SNAPSHOT_FAST_INTERVAL_MS || 30000);
    setInterval(() => void safe('hero', snapshots_1.buildHomeHero)(), Math.max(10000, heroMs));
    setInterval(() => void safe('latest-blocks', snapshots_1.buildLatestBlocks)(), Math.max(10000, fastMs));
    setInterval(() => void safe('latest-transactions', snapshots_1.buildLatestTransactions)(), Math.max(10000, fastMs + 3000));
    setInterval(() => void safe('latest-ops', snapshots_1.buildLatestOps)(), Math.max(10000, fastMs + 6000));
    setInterval(() => void safe('latest-trades', snapshots_1.buildLatestTrades)(), Math.max(10000, fastMs + 9000));
    node_cron_1.default.schedule(process.env.CRON_PULSE || '*/5 * * * *', () => void safe('pulse', snapshots_1.buildHomePulse)());
    node_cron_1.default.schedule(process.env.CRON_TOP_WALLETS || '*/5 * * * *', () => void safe('top-wallets', snapshots_1.buildTopWallets)());
    node_cron_1.default.schedule(process.env.CRON_CEX_FLOWS || '*/5 * * * *', () => void safe('cex-flows', snapshots_1.buildCexFlows)());
    node_cron_1.default.schedule(process.env.CRON_ASSETS_POOLS || '*/5 * * * *', () => void safe('assets-pools', snapshots_1.buildAssetsPools)());
    node_cron_1.default.schedule(process.env.CRON_ECOSYSTEM || '15 * * * *', () => void safe('ecosystem-leaderboards', snapshots_1.buildEcosystemLeaderboards)());
    console.log('[snapshotScheduler] started');
    setTimeout(() => void safe('bootstrap', async () => {
        await (0, snapshots_1.buildHomeHero)();
        await (0, snapshots_1.buildLatestBlocks)();
        await (0, snapshots_1.buildLatestTransactions)();
        await (0, snapshots_1.buildLatestOps)();
        await (0, snapshots_1.buildLatestTrades)();
    })(), 5000);
}
//# sourceMappingURL=snapshotScheduler.js.map