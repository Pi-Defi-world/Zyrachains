/**
 * One-time seed script to backfill price_history with realistic data.
 * Run: ts-node scripts/seed-price-history.ts
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Zyrachain';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  const col = mongoose.connection.collection('price_history');

  const existing = await col.countDocuments();
  if (existing > 10) {
    console.log(`Already have ${existing} records, skipping seed`);
    await mongoose.disconnect();
    return;
  }

  const now = Date.now();
  const docs: any[] = [];
  let price = 1.85;

  // Generate 90 days of hourly data (every 5 min for last 6 hours, then hourly)
  for (let i = 90 * 24; i >= 0; i--) {
    const hour = Math.floor(i / 24);
    const minuteOffset = i % 24 === 0 ? 0 : Math.floor(Math.random() * 55);
    const ts = new Date(now - hour * 3600000 - minuteOffset * 60000);

    // Random walk with mean reversion toward $1.70
    const noise = (Math.random() - 0.5) * 0.04;
    const reversion = (1.70 - price) * 0.01;
    price = Math.max(1.0, Math.min(5.0, price + noise + reversion));

    docs.push({
      price: parseFloat(price.toFixed(4)),
      source: 'seed',
      timestamp: ts,
    });
  }

  await col.insertMany(docs, { ordered: false });
  console.log(`Seeded ${docs.length} price history records`);
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
