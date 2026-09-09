import axios from 'axios';
import mongoose from 'mongoose';

const PI_ADDR = /^G[A-Z2-7]{55}$/;
const HORIZON = process.env.PCT_HORIZON_BASE_URL || process.env.HORIZON_BASE_URL || 'http://docker-horizon-mainnet-1:8000';

function createClient() {
  const client = axios.create({
    baseURL: HORIZON,
    timeout: 12000,
    headers: { Accept: 'application/json' },
  });
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const cfg = error?.config;
      const status = error?.response?.status;
      const fallback = process.env.HORIZON_FALLBACK_URL || 'https://horizon.suban.org';
      if (cfg && !cfg.__fallbackTried && (typeof status !== 'number' || status === 429 || status >= 500)) {
        return client.request({ ...cfg, baseURL: fallback, __fallbackTried: true });
      }
      throw error;
    }
  );
  return client;
}

async function getAllOperations(client: any, accountId: string) {
  let cursor: string | undefined = undefined;
  const allOps: any[] = [];
  let pageCount = 0;
  
  while (true) {
    const params: any = { order: 'asc', limit: 200, join: 'transactions' };
    if (cursor) params.cursor = cursor;
    
    try {
      const { data } = await client.get(`/accounts/${accountId}/operations`, { params });
      const ops = data._embedded?.records || [];
      if (ops.length === 0) break;
      
      allOps.push(...ops);
      const nextLink = data._links?.next?.href;
      if (!nextLink || ops.length < 200) break;
      
      // Extract cursor from last operation
      const lastOp = ops[ops.length - 1];
      cursor = lastOp.paging_token || undefined;
      pageCount++;
      
      if (pageCount % 5 === 0) {
        console.log(`    Page ${pageCount}, total ops: ${allOps.length}`);
      }
    } catch (err: any) {
      if (err?.response?.status === 404) break;
      throw err;
    }
  }
  
  return allOps;
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI!, {
    dbName: process.env.MONGO_DB,
    serverSelectionTimeoutMS: 30000,
  });

  console.log('=== Full History Import ===\n');

  const coreCol = mongoose.connection.collection('core-team-addresses');
  const eventsCol = mongoose.connection.collection('pct-balance-events');
  const movementsCol = mongoose.connection.collection('pct-wallet-movements');
  const stateCol = mongoose.connection.collection('pct-wallet-state');

  // Get all core wallets
  const wallets = await coreCol.find({ identifier: { $regex: PI_ADDR } })
    .project({ identifier: 1 })
    .toArray();

  console.log(`Found ${wallets.length} wallets\n`);

  const client = createClient();
  let totalEvents = 0;
  let totalMovements = 0;
  let startingBalanceSum = 0;

  // Process in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < wallets.length; i += batchSize) {
    const batch = wallets.slice(i, i + batchSize);
    console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1} (wallets ${i + 1}-${Math.min(i + batchSize, wallets.length)})`);

    await Promise.all(batch.map(async (walletDoc, idx) => {
      const walletId = walletDoc.identifier;
      if (!walletId) return;

      const offset = i + idx;
      console.log(`  [${offset + 1}] ${walletId.slice(0, 20)}...`);

      try {
        const ops = await getAllOperations(client, walletId);
        console.log(`    Found ${ops.length} operations`);

        let walletStartingBalance = 0;
        let walletEvents = 0;
        let walletOut = 0;

        for (const op of ops) {
          const type = op.type;
          const assetType = op.asset_type;
          const createdAt = op.created_at ? new Date(op.created_at) : new Date();
          const pagingToken = op.paging_token;
          const ledger = pagingToken ? Number(pagingToken.split('-')[0]) || null : null;
          const txHash = op.transaction_hash || null;

          // Create account (initial funding)
          if (type === 'create_account') {
            const amount = Number(op.starting_balance || op.amount || 0);
            if (amount > 0) {
              walletStartingBalance += amount;
              await eventsCol.updateOne(
                { transactionHash: txHash, wallet: walletId },
                {
                  $setOnInsert: {
                    wallet: walletId,
                    oldBalance: 0,
                    newBalance: amount,
                    change: amount,
                    detectedAt: createdAt,
                    ledger: ledger,
                    transactionHash: txHash,
                    source: 'historical_create',
                  }
                },
                { upsert: true }
              );
              walletEvents++;
              totalEvents++;
            }
          }

          // Payment (native Pi)
          if (type === 'payment' && assetType === 'native') {
            const amount = Number(op.amount || 0);
            const from = op.from;
            const to = op.to;

            if (from === walletId && amount > 0) {
              // Outgoing
              await movementsCol.updateOne(
                { transactionHash: txHash, wallet: from },
                {
                  $setOnInsert: {
                    wallet: from,
                    destination: to,
                    amount: amount,
                    detectedAt: createdAt,
                    ledger: ledger,
                    transactionHash: txHash,
                  }
                },
                { upsert: true }
              );
              walletOut += amount;
              totalOut += amount;
              totalMovements++;

              await eventsCol.updateOne(
                { transactionHash: txHash, wallet: walletId },
                {
                  $setOnInsert: {
                    wallet: walletId,
                    oldBalance: null,
                    newBalance: null,
                    change: -amount,
                    detectedAt: createdAt,
                    ledger: ledger,
                    transactionHash: txHash,
                    source: 'historical',
                  }
                },
                { upsert: true }
              );
              walletEvents++;
              totalEvents++;
            }

            if (to === walletId && amount > 0) {
              // Incoming
              await eventsCol.updateOne(
                { transactionHash: txHash, wallet: walletId },
                {
                  $setOnInsert: {
                    wallet: walletId,
                    oldBalance: null,
                    newBalance: null,
                    change: amount,
                    detectedAt: createdAt,
                    ledger: ledger,
                    transactionHash: txHash,
                    source: 'historical',
                  }
                },
                { upsert: true }
              );
              walletEvents++;
              totalEvents++;
            }
          }
        }

        startingBalanceSum += walletStartingBalance;
        console.log(`    Starting balance: ${walletStartingBalance}, Out: ${walletOut}, Events: ${walletEvents}`);

      } catch (err: any) {
        console.error(`    Error: ${err.message}`);
      }
    }));

    console.log(`  Batch complete. Running totals - Events: ${totalEvents}, Movements: ${totalMovements}, Starting Sum: ${startingBalanceSum}`);
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n=== Import Complete ===');
  console.log(`Total Events: ${totalEvents}`);
  console.log(`Total Movements: ${totalMovements}`);
  console.log(`Total Starting Balance (sum of create_account): ${startingBalanceSum}`);

  // Update baseline
  const metaCol = mongoose.connection.collection('pct-monitor-meta');
  await metaCol.updateOne(
    { _id: 'meta' },
    {
      $set: {
        baselineSumPiCore: startingBalanceSum,
        lastFullScanAt: new Date(),
      }
    },
    { upsert: true }
  );
  console.log(`\n✓ Baseline set to: ${startingBalanceSum}`);

  // Refresh summary
  const { refreshPctSummary } = await import('../services/pct-summary');
  const summary = await refreshPctSummary();
  console.log('\nRefreshed Summary:');
  console.log(`  Starting Balance: ${summary.startingBalance}`);
  console.log(`  Current Balance: ${summary.currentBalance}`);
  console.log(`  Total Out: ${summary.totalOut}`);
  console.log(`  Confirmed Changes: ${summary.confirmedChanges}`);

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
