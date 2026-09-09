import 'dotenv/config';
import mongoose from 'mongoose';
import axios from 'axios';
import fs from 'fs';
import { refreshPctSummary } from '../services/pct-summary';

const CHECKPOINT_FILE = './scripts/.import-checkpoint.json';
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000;
const CONCURRENCY = 10;

interface Checkpoint {
  remaining: string[];
  index: number;
  totalEvents: number;
  totalMovements: number;
  success: number;
  errors: number;
  startTime: number;
}

function loadCheckpoint(): Checkpoint | null {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
    }
  } catch { /* ignore */ }
  return null;
}

function saveCheckpoint(data: Checkpoint): void {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2));
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url: string, params: Record<string, unknown>, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await axios.get(url, { params, timeout: 30000 });
      return r.data;
    } catch (e: any) {
      if (e?.response?.status === 404) return { _embedded: { records: [] } };
      if (i === retries - 1) throw e;
      await sleep(RETRY_DELAY);
    }
  }
}

async function processWallet(
  walletId: string,
  HORIZON: string,
  eventsCol: any,
  movementsCol: any,
  stateCol: any,
): Promise<{ events: number; movements: number }> {
  let events = 0;
  let movements = 0;
  let cursor: string | undefined;

  while (true) {
    const params: Record<string, unknown> = { order: 'asc', limit: 200 };
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
          {
            $setOnInsert: {
              wallet: walletId,
              destination: eff.from || '',
              amount,
              detectedAt: createdAt,
              ledger,
              transactionHash: txHash,
              source: 'historical',
            },
          },
          { upsert: true },
        );
        movements++;
      }

      await eventsCol.updateOne(
        { transactionHash: txHash, wallet: walletId },
        {
          $setOnInsert: {
            wallet: walletId,
            oldBalance: null,
            newBalance: null,
            change: eff.type === 'account_debited' ? -amount : amount,
            detectedAt: createdAt,
            ledger,
            transactionHash: txHash,
            source: 'historical',
          },
        },
        { upsert: true },
      );
      events++;
    }

    if (!records.length || records.length < 200) break;
    cursor = records[records.length - 1].paging_token;
  }

  // Fetch current balance to update wallet state
  try {
    const { data: account } = await axios.get(`${HORIZON}/accounts/${encodeURIComponent(walletId)}`, { timeout: 15000 });
    const native = account.balances?.find((b: any) => b.asset_type === 'native');
    const balance = native ? Number(native.balance) || 0 : 0;
    await stateCol.updateOne(
      { identifier: walletId },
      {
        $set: {
          identifier: walletId,
          lastBalance: balance,
          lastCheckedAt: new Date(),
        },
        $setOnInsert: {
          firstSeenBalance: balance,
          firstSeenAt: new Date(),
        },
      },
      { upsert: true },
    );
  } catch {
    // wallet may not exist on network yet — skip state update
  }

  return { events, movements };
}

async function main() {
  let checkpoint = loadCheckpoint();

  await mongoose.connect(process.env.MONGODB_URI!, {
    dbName: process.env.MONGODB_DB,
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 60000,
  });

  const movementsCol = mongoose.connection.collection('pct-wallet-movements');
  const eventsCol = mongoose.connection.collection('pct-balance-events');
  const stateCol = mongoose.connection.collection('pct-wallet-state');
  const coreCol = mongoose.connection.collection('core-team-addresses');

  const HORIZON =
    process.env.PCT_HORIZON_BASE_URL || 'http://docker-horizon-mainnet-1:8000';

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
      startTime: Date.now(),
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

  // Process wallets concurrently
  let idx = checkpoint.index;
  const workers = new Array(CONCURRENCY).fill(0).map(async () => {
    while (idx < checkpoint.remaining.length) {
      const i = idx++;
      const walletId = checkpoint.remaining[i];

      try {
        const { events, movements } = await processWallet(walletId, HORIZON, eventsCol, movementsCol, stateCol);
        checkpoint.totalEvents += events;
        checkpoint.totalMovements += movements;
        checkpoint.success++;

        if (checkpoint.success % 10 === 0) process.stdout.write('.');
        await sleep(50);
      } catch {
        checkpoint.errors++;
        if (checkpoint.errors <= 20 || checkpoint.errors % 100 === 0) process.stdout.write('E');
        await sleep(500);
      }

      checkpoint.index = i + 1;

      if ((i + 1) % 50 === 0 || i === checkpoint.remaining.length - 1) {
        const pct = ((i + 1) / checkpoint.remaining.length * 100).toFixed(1);
        const rate = ((i + 1) / ((Date.now() - checkpoint.startTime) / 1000)).toFixed(2);
        const eta = ((checkpoint.remaining.length - i - 1) / Math.max(Number(rate), 0.01)).toFixed(0);
        console.log(`\n${pct}% | ${i + 1}/${checkpoint.remaining.length} | Ev:${checkpoint.totalEvents} | Mv:${checkpoint.totalMovements} | Err:${checkpoint.errors} | ${rate}/s | ETA:${eta}s`);
        saveCheckpoint(checkpoint);
      }
    }
  });

  await Promise.all(workers);

  saveCheckpoint(checkpoint);

  const elapsed = ((Date.now() - checkpoint.startTime) / 1000 / 60).toFixed(1);
  console.log(`\n=== Complete ===`);
  console.log(`Processed: ${checkpoint.remaining.length} wallets`);
  console.log(`Success: ${checkpoint.success} | Errors: ${checkpoint.errors}`);
  console.log(`Total Events: ${checkpoint.totalEvents} | Movements: ${checkpoint.totalMovements}`);
  console.log(`Time: ${elapsed} minutes`);

  // Refresh the PCT summary so it picks up the new wallet states
  console.log('\nRefreshing PCT summary...');
  await refreshPctSummary();
  console.log('PCT summary refreshed.');

  console.log('\nCleaning checkpoint...');
  fs.unlinkSync(CHECKPOINT_FILE);

  await mongoose.disconnect();
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
