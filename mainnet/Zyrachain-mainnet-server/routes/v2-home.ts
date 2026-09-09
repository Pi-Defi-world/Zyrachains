import express, { Request, Response, Router } from 'express';
import * as snapshotBuilders from '../services/snapshots';
import { getSnapshotPayload } from '../services/snapshots/snapshotStore';
import {
  cacheGet,
  cacheSet,
  cacheDel,
  cacheKeySegment,
} from '../services/redisMemoryCache';
import { inc } from '../services/metrics';

const router: Router = express.Router();

const SEGMENT_TO_SNAPSHOT: Record<string, string> = {
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

const S_MAXAGE: Record<string, number> = {
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

const BUILDERS: Partial<Record<string, () => Promise<unknown>>> = {
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

function cacheHeaders(segment: string): string {
  const s = S_MAXAGE[segment] ?? 60;
  const swr = s * 2;
  return `public, s-maxage=${s}, stale-while-revalidate=${swr}`;
}

type OkBody = { success: true; data: unknown; updatedAt: string };
type ErrBody = { success: false; error: string };

async function readOrBuild(segment: string, forceRefresh = false): Promise<OkBody | ErrBody> {
  const started = Date.now();
  const snapId = SEGMENT_TO_SNAPSHOT[segment];
  if (!snapId) {
    return { success: false, error: 'Unknown segment' };
  }

  if (!forceRefresh) {
    const redisKey = cacheKeySegment(segment);
    const cached = await cacheGet(redisKey);
    if (cached) {
      inc('v2Home.cacheHit');
      try {
        return JSON.parse(cached) as OkBody;
      } catch {
        /* miss */
      }
    }
  }
  inc('v2Home.cacheMiss');

  let row = await getSnapshotPayload<unknown>(snapId);
  if (!row || forceRefresh) {
    const builder = BUILDERS[segment];
    if (builder) {
      try {
        inc('v2Home.builtOnRequest');
        await builder();
      } catch (e) {
        console.error(`[v2-home] build failed for ${segment}:`, e);
      }
      row = await getSnapshotPayload<unknown>(snapId);
    }
  }

  if (!row) {
    return { success: false, error: 'Snapshot not available' };
  }

  const out: OkBody = {
    success: true,
    data: row.payload,
    updatedAt: row.updatedAt.toISOString(),
  };

  if (!forceRefresh) {
    const ttl = S_MAXAGE[segment] ?? 60;
    await cacheSet(cacheKeySegment(segment), JSON.stringify(out), ttl);
  }

  inc('v2Home.durationMs', Date.now() - started);
  return out;
}

router.get('/:segment', async (req: Request, res: Response) => {
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
  } catch (e: unknown) {
    console.error('[v2-home] GET error:', e);
    return res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : 'Internal error',
    });
  }
});

router.post('/rebuild/:segment', async (req: Request, res: Response) => {
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
    await cacheDel(cacheKeySegment(segment));

    const snapId = SEGMENT_TO_SNAPSHOT[segment];
    const row = snapId ? await getSnapshotPayload(snapId) : null;

    res.setHeader('Cache-Control', 'no-store');
    return res.json({
      success: true,
      updatedAt: row?.updatedAt?.toISOString() ?? new Date().toISOString(),
    });
  } catch (e: unknown) {
    return res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : 'Rebuild failed',
    });
  }
});

export default router;
