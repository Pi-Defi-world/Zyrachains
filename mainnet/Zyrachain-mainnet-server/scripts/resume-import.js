require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');

const CHECKPOINT_FILE = './scripts/.import-checkpoint.json';
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000;

function loadCheckpoint() {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
      return data;
    }
  } catch (e) { }
  return null;
}

function saveCheckpoint(data) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2));
}

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
  let checkpoint = loadCheckpoint();

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB,
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 60000
  });

  const movementsCol = mongoose.connection.collection('pct-wallet-movements');
  const eventsCol = mongoose.connection.collection('pct-balance-events');
  const coreCol = mongoose.connection.collection('core-team-addresses');

  const HORIZON = process.env.PCT_HORIZON_BASE_URL || 'https://api.mainnet.minepi.com';

  if (!checkpoint) {
    console.log('No checkpoint found. Starting fresh.\n');

    const existingEvents = await eventsCol.countDocuments({ source: 'historical' });
    const existingMovements = await movementsCol.estimatedDocumentCount();
    console.log(`Existing data: ${existingEvents} events, ${existingMovements} movements\n`);

    const wallets = await coreCol.find({}).project({ identifier: 1 }).toArray();
    const processed = new Set(await eventsCol.distinct('wallet', { source: 'historical' }));
    const remaining = wallets.filter(w => w.identifier && !processed.has(w.identifier));

    checkpoint = {
      remaining: remaining.map(w => w.identifier),
      index: 0,
      totalEvents: existingEvents,
      totalMovements: existingMovements,
      success: 0,
      errors: 0,
      startTime: Date.now()
    };

    saveCheckpoint(checkpoint);
    console.log(`Starting: ${checkpoint.remaining.length} wallets to process\n`);
  } else {
    console.log('=== Resuming from checkpoint ===');
    console.log(`Index: ${checkpoint.index} / ${checkpoint.remaining.length}`);
    console.log(`Events: ${checkpoint.totalEvents}, Movements: ${checkpoint.totalMovements}`);
    console.log(`Success: ${checkpoint.success}, Errors: ${checkpoint.errors}\n`);
  }

  const totalToProcess = checkpoint.remaining.length - checkpoint.index;
  console.log(`Wallets to process: ${totalToProcess}\n`);

  let batchCount = 0;

  for (let i = checkpoint.index; i < checkpoint.remaining.length; i++) {
    const walletId = checkpoint.remaining[i];

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
          const ledger = eff.paging_token ? Number(eff.paging_token.split('-')[0]) || null : null;

          if (eff.type === 'account_debited') {
            await movementsCol.updateOne(
              { transactionHash: txHash, wallet: walletId },
              { $setOnInsert: { wallet: walletId, destination: eff.from || '', amount, detectedAt: createdAt, ledger, transactionHash: txHash } },
              { upsert: true }
            );
            checkpoint.totalMovements++;
          }

          await eventsCol.updateOne(
            { transactionHash: txHash, wallet: walletId },
            { $setOnInsert: { wallet: walletId, oldBalance: null, newBalance: null, change: eff.type === 'account_debited' ? -amount : amount, detectedAt: createdAt, ledger, transactionHash: txHash, source: 'historical' } },
            { upsert: true }
          );
          checkpoint.totalEvents++;
        }

        if (!records.length || records.length < 200) break;
        cursor = records[records.length - 1].paging_token;
      }

      checkpoint.success++;
      if (checkpoint.success % 10 === 0) {
        process.stdout.write('.');
      }
      await sleep(100);

    } catch (e) {
      checkpoint.errors++;
      if (checkpoint.errors <= 20 || checkpoint.errors % 100 === 0) {
        process.stdout.write('E');
      }
      await sleep(500);
    }

    checkpoint.index = i + 1;
    batchCount++;

    if (batchCount % 50 === 0) {
      const pct = ((i + 1) / checkpoint.remaining.length * 100).toFixed(1);
      const rate = ((i + 1) / ((Date.now() - checkpoint.startTime) / 1000)).toFixed(2);
      const eta = ((checkpoint.remaining.length - i - 1) / rate).toFixed(0);
      console.log(`\n${pct}% | ${i + 1}/${checkpoint.remaining.length} | Ev:${checkpoint.totalEvents} | Mv:${checkpoint.totalMovements} | Err:${checkpoint.errors} | ${rate}/s | ETA:${eta}s`);
      saveCheckpoint(checkpoint);
    }
  }

  saveCheckpoint(checkpoint);

  const elapsed = ((Date.now() - checkpoint.startTime) / 1000 / 60).toFixed(1);
  console.log(`\n=== Complete ===`);
  console.log(`Processed: ${checkpoint.remaining.length} wallets`);
  console.log(`Success: ${checkpoint.success} | Errors: ${checkpoint.errors}`);
  console.log(`Total Events: ${checkpoint.totalEvents} | Movements: ${checkpoint.totalMovements}`);
  console.log(`Time: ${elapsed} minutes`);
  console.log('\nCleaning checkpoint...');
  fs.unlinkSync(CHECKPOINT_FILE);

  await mongoose.disconnect();
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});