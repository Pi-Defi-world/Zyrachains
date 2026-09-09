"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const snapshotBuilders = __importStar(require("../services/snapshots"));
const snapshotStore_1 = require("../services/snapshots/snapshotStore");
const redisMemoryCache_1 = require("../services/redisMemoryCache");
const metrics_1 = require("../services/metrics");
const router = express_1.default.Router();
const SEGMENT_TO_SNAPSHOT = {
    hero: 'home_hero',
    'latest-blocks': 'latest_blocks',
    'latest-transactions': 'latest_transactions',
    'latest-ops': 'latest_ops',
    'latest-trades': 'latest_trades',
    pulse: 'home_pulse',
    'top-wallets': 'top_wallets',
    'cex-flows': 'cex_flows',
    'assets-pools': 'assets_pools',
    'ecosystem-leaderboards': 'ecosystem_leaderboards',
};
const S_MAXAGE = {
    hero: 10,
    'latest-blocks': 15,
    'latest-transactions': 15,
    'latest-ops': 15,
    'latest-trades': 20,
    pulse: 120,
    'top-wallets': 300,
    'cex-flows': 300,
    'assets-pools': 180,
    'ecosystem-leaderboards': 600,
};
const BUILDERS = {
    hero: snapshotBuilders.buildHomeHero,
    'latest-blocks': snapshotBuilders.buildLatestBlocks,
    'latest-transactions': snapshotBuilders.buildLatestTransactions,
    'latest-ops': snapshotBuilders.buildLatestOps,
    'latest-trades': snapshotBuilders.buildLatestTrades,
    pulse: snapshotBuilders.buildHomePulse,
    'top-wallets': snapshotBuilders.buildTopWallets,
    'cex-flows': snapshotBuilders.buildCexFlows,
    'assets-pools': snapshotBuilders.buildAssetsPools,
    'ecosystem-leaderboards': snapshotBuilders.buildEcosystemLeaderboards,
};
function cacheHeaders(segment) {
    const s = S_MAXAGE[segment] ?? 60;
    const swr = s * 2;
    return `public, s-maxage=${s}, stale-while-revalidate=${swr}`;
}
async function readOrBuild(segment, forceRefresh = false) {
    const started = Date.now();
    const snapId = SEGMENT_TO_SNAPSHOT[segment];
    if (!snapId) {
        return { success: false, error: 'Unknown segment' };
    }
    if (!forceRefresh) {
        const redisKey = (0, redisMemoryCache_1.cacheKeySegment)(segment);
        const cached = await (0, redisMemoryCache_1.cacheGet)(redisKey);
        if (cached) {
            (0, metrics_1.inc)('v2Home.cacheHit');
            try {
                return JSON.parse(cached);
            }
            catch {
            }
        }
    }
    (0, metrics_1.inc)('v2Home.cacheMiss');
    let row = await (0, snapshotStore_1.getSnapshotPayload)(snapId);
    if (!row || forceRefresh) {
        const builder = BUILDERS[segment];
        if (builder) {
            try {
                (0, metrics_1.inc)('v2Home.builtOnRequest');
                await builder();
            }
            catch (e) {
                console.error(`[v2-home] build failed for ${segment}:`, e);
            }
            row = await (0, snapshotStore_1.getSnapshotPayload)(snapId);
        }
    }
    if (!row) {
        return { success: false, error: 'Snapshot not available' };
    }
    const out = {
        success: true,
        data: row.payload,
        updatedAt: row.updatedAt.toISOString(),
    };
    if (!forceRefresh) {
        const ttl = S_MAXAGE[segment] ?? 60;
        await (0, redisMemoryCache_1.cacheSet)((0, redisMemoryCache_1.cacheKeySegment)(segment), JSON.stringify(out), ttl);
    }
    (0, metrics_1.inc)('v2Home.durationMs', Date.now() - started);
    return out;
}
router.get('/:segment', async (req, res) => {
    try {
        const segment = String(req.params.segment || '').toLowerCase();
        const forceRefresh = req.query.fresh === '1';
        const result = await readOrBuild(segment, forceRefresh);
        if (!result.success) {
            res.setHeader('Cache-Control', 'no-store');
            const code = result.error === 'Unknown segment' ? 404 : 503;
            return res.status(code).json(result);
        }
        res.setHeader('Cache-Control', forceRefresh ? 'no-store' : cacheHeaders(segment));
        return res.json(result);
    }
    catch (e) {
        console.error('[v2-home] GET error:', e);
        return res.status(500).json({
            success: false,
            error: e instanceof Error ? e.message : 'Internal error',
        });
    }
});
router.post('/rebuild/:segment', async (req, res) => {
    const secret = process.env.SNAPSHOT_REBUILD_SECRET;
    if (secret && req.headers['x-rebuild-secret'] !== secret) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const segment = String(req.params.segment || '').toLowerCase();
    const builder = BUILDERS[segment];
    if (!builder) {
        return res.status(404).json({ success: false, error: 'Unknown segment' });
    }
    try {
        await builder();
        await (0, redisMemoryCache_1.cacheDel)((0, redisMemoryCache_1.cacheKeySegment)(segment));
        const snapId = SEGMENT_TO_SNAPSHOT[segment];
        const row = snapId ? await (0, snapshotStore_1.getSnapshotPayload)(snapId) : null;
        res.setHeader('Cache-Control', 'no-store');
        return res.json({
            success: true,
            updatedAt: row?.updatedAt?.toISOString() ?? new Date().toISOString(),
        });
    }
    catch (e) {
        return res.status(500).json({
            success: false,
            error: e instanceof Error ? e.message : 'Rebuild failed',
        });
    }
});
exports.default = router;
//# sourceMappingURL=v2-home.js.map