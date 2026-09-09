require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { 
    dbName: process.env.MONGODB_DB,
    serverSelectionTimeoutMS: 30000 
  });

  console.log('=== Fix TRUE Baseline ===\n');

  const metaCol = mongoose.connection.collection('pct-monitor-meta');
  const stateCol = mongoose.connection.collection('pct-wallet-state');
  const coreCol = mongoose.connection.collection('core-team-addresses');

  // TRUE starting balance: 2000001 per wallet
  const walletCount = await coreCol.countDocuments({});
  const TRUE_STARTING = 2000001 * walletCount;
  
  console.log('Wallet count:', walletCount);
  console.log('TRUE starting balance:', TRUE_STARTING);
  console.log('Expected: 20002010001\n');

  // Get current balance for CORE wallets only
  const coreIds = (await coreCol.find({}).project({identifier:1}).toArray())
    .map(d => d.identifier).filter(Boolean);
  
  const allStates = await stateCol.find({ identifier: { $in: coreIds } }).toArray();
  const current = allStates.reduce((sum, doc) => sum + (doc.lastBalance || 0), 0);
  
  console.log('Current balance (core only):', current);
  console.log('TRUE Total Out:', TRUE_STARTING - current);
  console.log('Expected Total Out: -2169777655.16\n');

  // Update meta
  await metaCol.updateOne(
    { _id: 'meta' },
    { $set: { baselineSumPiCore: TRUE_STARTING, lastFullScanAt: new Date() } },
    { upsert: true }
  );
  console.log('✓ Updated baseline to', TRUE_STARTING, '\n');

  // Refresh summary
  const { refreshPctSummary } = require('./dist/services/pct-summary');
  const summary = await refreshPctSummary();

  console.log('=== Updated Summary ===');
  console.log('Starting Balance:', summary.startingBalance);
  console.log('Current Balance:', summary.currentBalance);
  console.log('Total Out:', summary.totalOut);
  console.log('24h Net Change:', summary.netChange24h);
  console.log('Confirmed Changes:', summary.confirmedChanges);

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
