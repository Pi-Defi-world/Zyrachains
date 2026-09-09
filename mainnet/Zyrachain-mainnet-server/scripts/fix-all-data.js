require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const HORIZON = process.env.PCT_HORIZON_BASE_URL || 'https://api.mainnet.minepi.com';

async function getStartingBalance(walletId) {
  try {
    let cursor = undefined;
    let totalStarting = 0;
    while (true) {
      const params = { order: 'asc', limit: 200 };
      if (cursor) params.cursor = cursor;
      const r = await axios.get(`${HORIZON}/accounts/${walletId}/operations`, { params });
      const ops = r.data._embedded?.records || [];
      const creates = ops.filter(o => o.type === 'create_account');
      totalStarting += creates.reduce((s, o) => s + Number(o.starting_balance || o.amount || 0), 0);
      if (ops.length < 200) break;
      cursor = ops[ops.length - 1].paging_token;
    }
    return totalStarting;
  } catch (e) {
    if (e.response?.status === 404) return 0;
    throw e;
  }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { 
    dbName: process.env.MONGODB_DB,
    serverSelectionTimeoutMS: 30000 
  });

  console.log('=== Fixing All Data ===\n');

  const coreCol = mongoose.connection.collection('core-team-addresses');
  const stateCol = mongoose.connection.collection('pct-wallet-state');
  const metaCol = mongoose.connection.collection('pct-monitor-meta');

  // Get all core wallets
  const wallets = await coreCol.find({}).project({ identifier: 1 }).toArray();
  console.log(`Found ${wallets.length} wallets\n`);

  // Calculate TRUE starting balance from create_account operations
  console.log('Calculating TRUE starting balance from blockchain...\n');
  let trueStartingBalance = 0;
  const sampleSize = 10; // Test with 10 wallets first

  for (let i = 0; i < Math.min(sampleSize, wallets.length); i++) {
    const id = wallets[i].identifier;
    if (!id) continue;
    try {
      const bal = await getStartingBalance(id);
      trueStartingBalance += bal;
      console.log(`[${i+1}] ${id.slice(0,15)}... Starting: ${bal}`);
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`[${i+1}] Error: ${e.message}`);
    }
  }

  // Project to all wallets
  const projectedTotal = trueStartingBalance * (wallets.length / sampleSize);
  console.log(`\nProjected total starting balance: ${projectedTotal}`);
  console.log(`(Expected: 20,002,010,001)\n`);

  // Get current balance
  const currentAgg = await stateCol.aggregate([
    { $group: { _id: null, total: { $sum: '$lastBalance' } }
  ]).toArray();
  const currentBalance = currentAgg[0]?.total || 0;

  // Calculate TRUE Total Out
  const trueTotalOut = projectedTotal - currentBalance;

  console.log('=== RESULTS ===');
  console.log(`TRUE Starting Balance: ${projectedTotal}`);
  console.log(`Current Balance: ${currentBalance}`);
  console.log(`TRUE Total Out: -${trueTotalOut}`);
  console.log(`(Expected Total Out: -2,169,777,655.16)\n`);

  // Update meta with TRUE starting balance
  await metaCol.updateOne(
    { _id: 'meta' },
    { 
      $set: { 
        baselineSumPiCore: projectedTotal,
        lastFullScanAt: new Date()
      } 
    },
    { upsert: true }
  );
  console.log('✓ Updated baseline to TRUE starting balance\n');

  // Refresh summary
  const { refreshPctSummary } = require('./dist/services/pct-summary');
  const summary = await refreshPctSummary();

  console.log('=== Updated Summary ===');
  console.log(`Starting Balance: ${summary.startingBalance}`);
  console.log(`Current Balance: ${summary.currentBalance}`);
  console.log(`Total Out: ${summary.totalOut}`);
  console.log(`Confirmed Changes: ${summary.confirmedChanges}`);

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
