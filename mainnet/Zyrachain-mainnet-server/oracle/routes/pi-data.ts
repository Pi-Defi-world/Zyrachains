/**
 * Pi Network data-style endpoints (mounted at /data)
 * All price data is proxied from the oracle.suban.org oracle.
 */
import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { getSnapshotPayload } from '../../services/snapshots/snapshotStore';
import type { HomeHeroPayload } from '../../services/snapshots/types';

const ORACLE_URL = process.env.ORACLE_BASE_URL || 'https://oracle.suban.org';

const FALLBACK_SUPPLY = {
  total_circulating_supply: 10_600_000_000,
  total_locked: 6_170_000_000,
  total_supply: 100_000_000_000,
};

export function createPiDataRouter(): Router {
  const router = Router();

  router.get('/pi-price', async (_req: Request, res: Response) => {
    try {
      const response = await fetch(`${ORACLE_URL}/data/pi-price`);
      if (!response.ok) throw new Error(`Oracle returned ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error proxying Pi price from oracle', { error: errorMessage });
      res.status(502).json({
        error: 'Failed to fetch Pi price from upstream oracle',
        message: errorMessage,
      });
    }
  });

  router.get('/mainnet-supply', async (_req: Request, res: Response) => {
    try {
      const row = await getSnapshotPayload<HomeHeroPayload>('home_hero');
      if (row?.payload) {
        const p = row.payload;
        return res.json({
          total_circulating_supply: p.total_circulating_supply,
          total_locked: p.total_locked,
          total_supply: p.total_supply,
          updatedAt: row.updatedAt.toISOString(),
        });
      }
    } catch (e) {
      logger.warn('mainnet-supply snapshot miss', { error: String(e) });
    }
    return res.json(FALLBACK_SUPPLY);
  });

  router.get('/check-scam-wallet/:address', async (req: Request, res: Response) => {
    const { address } = req.params;
    const knownScamAddresses = new Set<string>([]);
    const is_scam = knownScamAddresses.has(address);
    res.json({
      address,
      is_scam,
      reason: is_scam ? 'Flagged as scam address' : null,
    });
  });

  router.get('/top-accounts', async (_req: Request, res: Response) => {
    res.json({
      accounts: [],
      total: 0,
      message: 'Top accounts data not yet available',
    });
  });

  router.get('/accounts/distribution', async (_req: Request, res: Response) => {
    res.json({
      distribution: [],
      total_accounts: 0,
      message: 'Account distribution data not yet available',
    });
  });

  return router;
}
