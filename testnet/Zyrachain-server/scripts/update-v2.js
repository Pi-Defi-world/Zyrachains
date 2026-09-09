require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { 
    dbName: process.env.MONGODB_DB,
    serverSelectionTimeoutMS: 30000 
  });

  console.log('=== Update v2 ===\n');

  const metaCol = mongoose.connection.collection('pct-monitor-meta');
  const stateCol = mongoose.connection.collection('pct-wallet-state');
  const coreCol = mongoose.connection.collection('core-team-addresses');

  // TRUE starting balance: 2000001 per wallet
  const walletCount = await coreCol.countDocuments({});
  const TRUE_STARTING = 2000001 * walletCount;

  console.log('Wallet count:', walletCount);
  console.log('TRUE starting balance:', TRUE_STARTING);
  console.log('Expected: 20,002,010,001\n');

  // Get current balance
  const currentAgg = await stateCol.aggregate([
    { $group: { _id: null, total: { $sum: '$lastBalance' } } }
  ]).toArray();
  const currentBalance = currentAgg[0]?.total || 0;

  console.log('Current balance:', currentBalance);
  console.log('TRUE Total Out:', TRUE_STARTING - currentBalance);
  console.log('Expected Total Out: -2,169,777,655.16\n');

  // Update meta
  await metaCol.updateOne(
    { _id: 'meta' },
    { 
      $set: { 
        baselineSumPiCore: TRUE_STARTING,
        lastFullScanAt: new Date()
      } 
    },
    { upsert: true }
  );
  console.log('✓ Baseline updated to', TRUE_STARTING, '\n');

  // Refresh summary
  const { refreshPctSummary } = require('./dist/services/pct-summary');
  const summary = await refreshPctSummary();

  console.log('=== Updated Summary ===');
  console.log('Starting Balance:', summary.startingBalance);
  console.log('Current Balance:', summary.currentBalance);
  console.log('Total Out:', summary.totalOut);
  console.log('24h Net Change:', summary.netChange24h);

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
