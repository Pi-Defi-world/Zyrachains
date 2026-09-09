import axios from 'axios';
import mongoose from 'mongoose';

const PI_ADDR = /^G[A-Z2-7]{55}$/;
const HORIZON_BASE = process.env.PCT_HORIZON_BASE_URL || process.env.HORIZON_BASE_URL || 'http://docker-horizon-mainnet-1:8000';
const HORIZON_FALLBACK = process.env.HORIZON_FALLBACK_URL || process.env.NEXT_PUBLIC_HORIZON_FALLBACK_URL || 'https://horizon.suban.org';

function createClient() {
  const client = axios.create({
    baseURL: HORIZON_BASE,
    timeout: 12000,
    headers: { Accept: 'application/json' },
  });
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const cfg = error?.config;
      const status = error?.response?.status;
      if (cfg && !cfg.__fallbackTried && HORIZON_FALLBACK && 
          (typeof status !== 'number' || status === 429 || status >= 500)) {
        return client.request({ ...cfg, __fallbackTried: true, baseURL: HORIZON_FALLBACK });
      }
      throw error;
    }
  );
  return client;
}

async function getAccountPayments(client: axios.AxiosInstance, accountId: string, cursor?: string) {
  try {
    const params: Record<string, string> = { 
      order: 'asc', 
      limit: '200',
      join: 'transactions'
    };
    if (cursor && cursor !== 'now') params.cursor = cursor;
    
    const { data } = await client.get<{ _embedded?: { records?: any[] } }>(
      `/accounts/${accountId}/payments`,
      { params }
    );
    return data._embedded?.records || [];
  } catch (err: any) {
    if (err?.response?.status === 404) return [];
    throw err;
  }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, { 
    dbName: process.env.MONGODB_DB,
    serverSelectionTimeoutMS: 30000 
  });

  console.log('=== Historical Import ===\n');

  const coreCol = mongoose.connection.collection('core-team-addresses');
  const eventsCol = mongoose.connection.collection('pct-balance-events');
  const movementsCol = mongoose.connection.collection('pct-wallet-movements');
  const stateCol = mongoose.connection.collection('pct-wallet-state');

  // Get all core wallets
  const wallets = await coreCol.find({ identifier: { $regex: PI_ADDR } })
    .project({ identifier: 1 })
    .toArray();
  
  console.log(`Found ${wallets.length} wallets to scan\n`);

  const client = createClient();
  let totalEvents = 0;
  let totalMovements = 0;
  let totalOut = 0;

  // For each wallet, get ALL historical payments
  for (let i = 0; i < wallets.length; i++) {
    const walletId = wallets[i].identifier;
    if (!walletId) continue;

    console.log(`[${i+1}/${wallets.length}] Scanning ${walletId.slice(0, 20)}...`);
    
    let cursor: string | undefined = undefined;
    let pageCount = 0;
    let walletEvents = 0;
    let walletOut = 0;

    // Paginate through ALL historical payments
    while (true) {
      const records = await getAccountPayments(client, walletId, cursor);
      if (records.length === 0) break;

      for (const row of records) {
        const type = row.type;
        const assetType = row.asset_type;
        if (type !== 'payment' || assetType !== 'native') continue;

        const amount = Number(row.amount || 0);
        const from = row.from;
        const to = row.to;
        const pagingToken = String(row.paging_token || '');
        const createdAt = row.created_at ? new Date(row.created_at) : new Date();
        const txHash = row.transaction_hash || null;
        const ledger = pagingToken ? Number(pagingToken.split('-')[0]) || null : null;

        cursor = pagingToken || cursor;

        // Outgoing payment (from this wallet)
        if (from === walletId && amount > 0) {
          await movementsCol.updateOne(
            { transactionHash: txHash, wallet: from },
            { 
              $setOnInsert: {
                wallet: from,
                destination: to,
                amount: amount,
                detectedAt: createdAt,
                ledger: ledger,
                transactionHash: txHash
              }
            },
            { upsert: true }
          );
          walletOut += amount;
          totalOut += amount;
          totalMovements++;
        }

        // Record balance change event
        await eventsCol.updateOne(
          { transactionHash: txHash, wallet: walletId },
          { 
            $setOnInsert: {
              wallet: walletId,
              oldBalance: null,
              newBalance: null,
              change: from === walletId ? -amount : amount,
              detectedAt: createdAt,
              ledger: ledger,
              transactionHash: txHash,
              source: 'historical'
            }
          },
          { upsert: true }
        );
        walletEvents++;
        totalEvents++;
      }

      pageCount++;
      if (pageCount % 10 === 0) {
        console.log(`  Page ${pageCount}, events so far: ${walletEvents}, out: ${walletOut}`);
      }

      if (records.length < 200) break; // Last page
    }

    console.log(`  Done: ${walletEvents} events, out: ${walletOut.toFixed(2)}\n`);
  }

  console.log('\n=== Import Complete ===');
  console.log(`Total events: ${totalEvents}`);
  console.log(`Total movements: ${totalMovements}`);
  console.log(`Total outflow: ${totalOut.toFixed(2)}`);

  // Refresh summary
  const { refreshPctSummary } = await import('../services/pct-summary');
  await refreshPctSummary();
  console.log('Summary refreshed!');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
