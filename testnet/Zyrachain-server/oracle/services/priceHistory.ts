/**
 * Price history service - persists price observations for 24h stats
 */
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export interface PriceObservation {
  price: number;
  timestamp: Date;
  source: string;
}

const COLLECTION = 'price_history';

export async function recordPrice(price: number, source: string): Promise<void> {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) return;
    await mongoose.connection.collection(COLLECTION).insertOne({
      price,
      source,
      timestamp: new Date(),
    });
  } catch (e) {
    logger.warn('Failed to record price history', { error: String(e) });
  }
}

export async function get24hStats(): Promise<{
  high24h: number;
  low24h: number;
  open24h: number;
  closePrice: number;
} | null> {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) return null;
    const since = new Date(Date.now() - 86_400_000);
    const docs = await mongoose.connection
      .collection(COLLECTION)
      .find({ timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .toArray();

    if (docs.length === 0) return null;

    const prices = docs.map((d) => d.price as number);
    const high24h = Math.max(...prices);
    const low24h = Math.min(...prices);
    const open24h = docs[0].price;
    const closePrice = docs[docs.length - 1].price;

    return { high24h, low24h, open24h, closePrice };
  } catch (e) {
    logger.warn('Failed to get 24h stats', { error: String(e) });
    return null;
  }
}

export async function trimOldPrices(): Promise<void> {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) return;
    const cutoff = new Date(Date.now() - 30 * 86_400_000);
    await mongoose.connection.collection(COLLECTION).deleteMany({ timestamp: { $lt: cutoff } });
  } catch (e) {
    logger.warn('Failed to trim price history', { error: String(e) });
  }
}
