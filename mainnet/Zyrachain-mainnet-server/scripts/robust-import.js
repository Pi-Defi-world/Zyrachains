require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;

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
      console.log(`  Retry ${i + 1}/${retries}...`);
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

  const movementsCol = mongoose.connection.collection('pct-wallet-movements');
  const eventsCol = mongoose.connection.collection('pct-balance-events');
  const coreCol = mongoose.connection.collection('core-team-addresses');

  const existingEvents = await eventsCol.countDocuments({});
  const existingMovements = await movementsCol.countDocuments({});
  console.log(`Current: ${existingEvents} events, ${existingMovements} movements\n`);

  const HORIZON = process.env.PCT_HORIZON_BASE_URL || 'https://api.mainnet.minepi.com';
  const wallets = await coreCol.find({}).project({ identifier: 1 }).toArray();
  
  const processed = new Set(await eventsCol.distinct('wallet'));
  const remaining = wallets.filter(w => !processed.has(w.identifier));
  console.log(`Remaining: ${remaining.length} wallets\n`);

  let totalEvents = existingEvents;
  let totalMovements = existingMovements;
  let success = 0;
  let errors = 0;
  let i = 0;

  for (const w of remaining) {
    const walletId = w.identifier;
    if (!walletId) continue;
    i++;

    try {
      let cursor;
      while (true) {
        const params = { order: 'asc', limit: 200 };
        if (cursor) params.cursor = cursor;

        const data = await fetchWithRetry(`${HORIZON}/accounts/${walletId}/effects`, params);

        for (const eff of data._embedded?.records || []) {
          if (eff.type !== 'account_credited' && eff.type !== 'account_debited') continue;
          if (eff.asset_type !== 'native') continue;

          const amount = Number(eff.amount || 0);
          if (amount <= 0) continue;

          const txHash = eff.transaction_hash || null;
          const createdAt = eff.created_at ? new Date(eff.created_at) : new Date();
          const ledger = eff.paging_token ? Number(eff.paging_token.split('-')[0]) || null : null;

          if (eff.type === 'account_debited') {
            await movementsCol.updateOne(
              { transactionHash: txHash, wallet: walletId },
              { $setOnInsert: { wallet: walletId, destination: eff.from || '', amount, detectedAt: createdAt, ledger, transactionHash: txHash } },
              { upsert: true }
            );
            totalMovements++;
          }

          await eventsCol.updateOne(
            { transactionHash: txHash, wallet: walletId },
            { $setOnInsert: { wallet: walletId, oldBalance: null, newBalance: null, change: eff.type === 'account_debited' ? -amount : amount, detectedAt: createdAt, ledger, transactionHash: txHash, source: 'historical' } },
            { upsert: true }
          );
          totalEvents++;
        }

        if (!data._embedded?.records?.length || data._embedded.records.length < 200) break;
        cursor = data._embedded.records[data._embedded.records.length - 1].paging_token;
      }

      success++;
      if (success % 100 === 0) {
        console.log(`Progress: ${success}/${remaining.length} | Events: ${totalEvents} | Mov: ${totalMovements}`);
      }

      await sleep(200);
    } catch (e) {
      errors++;
      if (errors <= 20 || errors % 50 === 0) {
        console.log(`Error ${walletId.slice(0, 15)}: ${e.message.slice(0, 80)}`);
      }
      await sleep(2000);
    }

    if (i >= 3000) {
      console.log('\nReached limit. Stopping.');
      break;
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`Success: ${success} | Errors: ${errors} | Events: ${totalEvents} | Mov: ${totalMovements}`);

  await mongoose.disconnect();
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});