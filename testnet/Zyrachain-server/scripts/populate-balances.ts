import 'dotenv/config';
import mongoose from 'mongoose';
import axios from 'axios';
import fs from 'fs';
import { refreshPctSummary } from '../services/pct-summary';

const PI_ADDR = /^G[A-Z2-7]{55}$/;
const CONCURRENCY = 8;
const HORIZON = process.env.PCT_HORIZON_BASE_URL || 'http://docker-horizon-mainnet-1:8000';
const CKPT_FILE = './scripts/.balance-checkpoint.json';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchBalance(identifier: string): Promise<number | null> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const { data } = await axios.get(`${HORIZON}/accounts/${encodeURIComponent(identifier)}`, { timeout: 15000 });
      const native = data.balances?.find((b: any) => b.asset_type === 'native');
      return native ? Number(native.balance) || 0 : 0;
    } catch (e: any) {
      if (e?.response?.status === 404) return 0;
      if (e?.response?.status === 429) {
        await sleep(Number(e?.response?.headers?.['retry-after']) * 1000 || 2000);
        continue;
      }
      if (attempt < 5) { await sleep(Math.min(30000, 1000 * Math.pow(2, attempt))); continue; }
      return null;
    }
  }
  return null;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, {
    dbName: process.env.MONGODB_DB,
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 60000,
  });

  const coreCol = mongoose.connection.collection('core-team-addresses');
  const stateCol = mongoose.connection.collection('pct-wallet-state');

  const docs = await coreCol.find({ identifier: { $regex: PI_ADDR } }).project({ identifier: 1 }).toArray();
  const allWallets = docs.map(d => String(d.identifier));

  // Skip wallets that already have state from a prior run
  let remaining: string[];
  try {
    const ckpt = JSON.parse(fs.readFileSync(CKPT_FILE, 'utf8'));
    remaining = ckpt.remaining;
    console.log(`Resuming: ${remaining.length} wallets remaining (from checkpoint)\n`);
  } catch {
    const existing = await stateCol.find({ identifier: { $in: allWallets } }).project({ identifier: 1 }).toArray();
    const done = new Set(existing.map(s => String(s.identifier)));
    remaining = allWallets.filter(w => !done.has(w));
    console.log(`Starting fresh: ${allWallets.length} total, ${remaining.length} need balance fetch\n`);
  }

  if (remaining.length === 0) {
    console.log('All wallets already have balance state. Skipping fetch.');
  } else {
    let processed = 0;
    let failed = 0;
    let zeroBalance = 0;
    let idx = 0;

    const workers = new Array(CONCURRENCY).fill(0).map(async () => {
      while (idx < remaining.length) {
        const i = idx++;
        const wallet = remaining[i];
        const balance = await fetchBalance(wallet);
        if (balance === null) {
          failed++;
          process.stdout.write('E');
        } else {
          if (balance === 0) zeroBalance++;
          await stateCol.updateOne(
            { identifier: wallet },
            {
              $set: { identifier: wallet, lastBalance: balance, lastCheckedAt: new Date() },
              $setOnInsert: { firstSeenBalance: balance, firstSeenAt: new Date() },
            },
            { upsert: true },
          );
          processed++;
          if (processed % 20 === 0) process.stdout.write('.');
        }
        await sleep(80);

        if ((i + 1) % 200 === 0 || i === remaining.length - 1) {
          const pct = ((i + 1) / remaining.length * 100).toFixed(1);
          console.log(`  ${pct}% | ${i + 1}/${remaining.length} | ok:${processed} | zero:${zeroBalance} | fail:${failed}`);
          fs.writeFileSync(CKPT_FILE, JSON.stringify({ remaining: remaining.slice(i + 1) }));
        }
      }
    });

    await Promise.all(workers);
    fs.unlinkSync(CKPT_FILE);
    console.log(`\nDone. ${processed} wallets updated, ${zeroBalance} with 0 balance, ${failed} failed.`);
  }

  // Verify a few
  const sample = await stateCol.find({ identifier: { $in: allWallets.slice(0, 5) } }).toArray();
  for (const s of sample) {
    console.log(`  ${String(s.identifier).slice(0, 8)}…  balance=${s.lastBalance}`);
  }

  console.log('\nRefreshing PCT summary...');
  await refreshPctSummary();
  console.log('Done.');

  await mongoose.disconnect();
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
