/**
 * Public chart data endpoints (no API key required)
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { logger } from '../oracle/utils/logger';

const router: Router = Router();

/** GET /api/charts/price-history?range=1d|7d|30d|90d */
router.get('/price-history', async (req: Request, res: Response) => {
  try {
    const range = (req.query.range as string) || '7d';
    const hours: Record<string, number> = { '1d': 24, '7d': 168, '30d': 720, '90d': 2160 };
    const span = hours[range] || 168;

    const col = mongoose.connection.collection('price_history');
    const since = new Date(Date.now() - span * 3600000);
    const docs = await col
      .find({ timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .toArray();

    if (docs.length === 0) {
      return res.json({ data: [], source: 'empty' });
    }

    const bucketMs = span <= 24 ? 3600000 : 86400000;
    const buckets = new Map<number, { open: number; high: number; low: number; close: number; volume: number }>();
    for (const doc of docs) {
      const bucket = Math.floor(doc.timestamp.getTime() / bucketMs) * bucketMs / 1000;
      if (!buckets.has(bucket)) {
        buckets.set(bucket, { open: doc.price, high: doc.price, low: doc.price, close: doc.price, volume: 0 });
      } else {
        const b = buckets.get(bucket)!;
        b.high = Math.max(b.high, doc.price);
        b.low = Math.min(b.low, doc.price);
        b.close = doc.price;
        b.volume += doc.price;
      }
    }

    const points = Array.from(buckets.entries()).map(([time, b]) => ({
      time,
      open: parseFloat(b.open.toFixed(4)),
      high: parseFloat(b.high.toFixed(4)),
      low: parseFloat(b.low.toFixed(4)),
      close: parseFloat(b.close.toFixed(4)),
      volume: Math.floor(b.volume),
    }));

    return res.json({ data: points, source: 'real' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching price history', { error: msg });
    return res.json({ data: [], source: 'error' });
  }
});

export default router;
