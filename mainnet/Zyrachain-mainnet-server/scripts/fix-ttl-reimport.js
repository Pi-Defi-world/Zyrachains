require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const MAX_RETRIES = 2;
const RETRY_DELAY = 2000;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url, params, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await axios.get(url, { params, timeout: 30000 });
      return r.data;
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(RETRY_DELAY);
    }
  }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB,
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 60000
  });

  const mov = mongoose.connection.collection('pct-wallet-movements');
  const ev = mongoose.connection.collection('pct-balance-events');
  const core = mongoose.connection.collection('core-team-addresses');

  // 1. Drop TTL indexes
  console.log('=== Step 1: Drop TTL indexes ===');
  try {
    await mov.dropIndex('detectedAt_1');
    console.log('  Dropped TTL index on movements');
  } catch (e) { console.log('  Movement TTL index already gone:', e.message); }
  try {
    await ev.dropIndex('detectedAt_1');
    console.log('  Dropped TTL index on events');
  } catch (e) { console.log('  Event TTL index already gone:', e.message); }

  // 2. Create non-TTL indexes for query performance
  console.log('\n=== Step 2: Create query indexes ===');
  await mov.createIndex({ detectedAt: -1, _id: -1 });
  await mov.createIndex({ wallet: 1, detectedAt: -1 });
  await ev.createIndex({ detectedAt: -1, _id: -1 });
  await ev.createIndex({ wallet: 1, detectedAt: -1 });
  console.log('  Created query indexes');

  // 3. Delete ALL existing data
  console.log('\n=== Step 3: Clean old data ===');
  const delMov = await mov.deleteMany({});
  const delEv = await ev.deleteMany({});
  console.log(`  Deleted ${delMov.deletedCount} movements, ${delEv.deletedCount} events`);

  // 4. Re-import all historical data
  console.log('\n=== Step 4: Import historical data ===');
  const wallets = await core.find({}).project({ identifier: 1 }).toArray();
  console.log(`  Total wallets: ${wallets.length}`);

  const HORIZON = process.env.PCT_HORIZON_BASE_URL || 'https://api.mainnet.minepi.com';
  let totalEvents = 0;
  let totalMovements = 0;
  let errors = 0;
  let batchCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < wallets.length; i++) {
    const walletId = wallets[i].identifier;
    if (!walletId) continue;

    try {
      let cursor;
      while (true) {
        const params = { order: 'asc', limit: 200 };
        if (cursor) params.cursor = cursor;

        const data = await fetchWithRetry(`${HORIZON}/accounts/${walletId}/effects`, params);
        const records = data._embedded?.records || [];

        for (const eff of records) {
          if (eff.type !== 'account_credited' && eff.type !== 'account_debited') continue;
          if (eff.asset_type !== 'native') continue;

          const amount = Number(eff.amount || 0);
          if (amount <= 0) continue;

          const txHash = eff.transaction_hash || null;
          const createdAt = eff.created_at ? new Date(eff.created_at) : new Date();

          if (eff.type === 'account_debited') {
            await mov.updateOne(
              { transactionHash: txHash, wallet: walletId },
              { $setOnInsert: { wallet: walletId, destination: eff.from || '', amount, detectedAt: createdAt, transactionHash: txHash, source: 'historical' } },
              { upsert: true }
            );
            totalMovements++;
          }

          await ev.updateOne(
            { transactionHash: txHash, wallet: walletId },
            { $setOnInsert: { wallet: walletId, change: eff.type === 'account_debited' ? -amount : amount, detectedAt: createdAt, transactionHash: txHash, source: 'historical' } },
            { upsert: true }
          );
          totalEvents++;
        }

        if (!records.length || records.length < 200) break;
        cursor = records[records.length - 1].paging_token;
      }

      await sleep(100);
    } catch (e) {
      errors++;
      await sleep(500);
    }

    batchCount++;
    if (batchCount % 100 === 0) {
      const pct = ((i + 1) / wallets.length * 100).toFixed(1);
      const rate = ((i + 1) / ((Date.now() - startTime) / 1000)).toFixed(2);
      console.log(`  ${pct}% | ${i + 1}/${wallets.length} | Ev:${totalEvents} | Mv:${totalMovements} | Err:${errors} | ${rate}/s`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n=== Import Complete ===`);
  console.log(`Success: ${wallets.length - errors} | Errors: ${errors}`);
  console.log(`Events: ${totalEvents} | Movements: ${totalMovements}`);
  console.log(`Time: ${elapsed} minutes`);

  // 5. Refresh summary
  console.log('\n=== Step 5: Refresh summary ===');
  const { refreshPctSummary } = require('./dist/services/pct-summary');
  const summary = await refreshPctSummary();

  console.log('\n=== Final Summary ===');
  console.log('Starting Balance:', summary.startingBalance?.toLocaleString());
  console.log('Current Balance:', summary.currentBalance?.toLocaleString());
  console.log('Total Out:', summary.totalOut?.toLocaleString());
  console.log('Confirmed Changes:', summary.confirmedChanges);
  console.log('24h Net Change:', summary.netChange24h);

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
