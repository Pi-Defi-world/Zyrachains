/**
 * Price oracle JSON API (mounted at /v1)
 * All price data is proxied from the oracle.suban.org oracle.
 */
import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

const ORACLE_URL = process.env.ORACLE_BASE_URL || 'https://oracle.suban.org';

export function createApiRouter(): Router {
  const router = Router();
  const startTime = Date.now();

  router.get('/price', async (_req: Request, res: Response) => {
    try {
      const response = await fetch(`${ORACLE_URL}/api/v1/price`);
      if (!response.ok) throw new Error(`Oracle returned ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error proxying price from oracle', { error: msg });
      res.status(502).json({
        error: 'Failed to fetch price from upstream oracle',
        message: msg,
      });
    }
  });

  router.get('/sources', async (_req: Request, res: Response) => {
    try {
      const response = await fetch(`${ORACLE_URL}/api/v1/sources`);
      if (!response.ok) throw new Error(`Oracle returned ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error proxying sources from oracle', { error: msg });
      res.status(502).json({
        error: 'Failed to fetch sources from upstream oracle',
        message: msg,
      });
    }
  });

  router.get('/health', (_req: Request, res: Response) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    res.json({
      status: 'healthy',
      uptime,
      timestamp: new Date(),
    });
  });

  return router;
}
