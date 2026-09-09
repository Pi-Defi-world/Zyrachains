require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const db = process.env.MONGODB_DB;
  
  await mongoose.connect(uri, { dbName: db, serverSelectionTimeoutMS: 30000 });
  
  console.log('=== Setting Accurate Baseline ===\n');
  
  const metaCol = mongoose.connection.collection('pct-monitor-meta');
  const stateCol = mongoose.connection.collection('pct-wallet-state');
  const eventsCol = mongoose.connection.collection('pct-balance-events');
  const movementsCol = mongoose.connection.collection('pct-wallet-movements');
  
  // Get current balance (sum of all core wallets)
  const coreCol = mongoose.connection.collection('core-team-addresses');
  const coreIds = (await coreCol.find({}).project({identifier:1}).toArray()).map(d=>d.identifier).filter(Boolean);
  
  const currentBalanceAgg = await stateCol.aggregate([
    { $match: { identifier: { $in: coreIds } } },
    { $group: { _id: null, total: { $sum: '$lastBalance' } } }
  ]).toArray();
  
  const currentBalance = currentBalanceAgg[0]?.total || 0;
  
  // Set the ACCURATE starting balance (from other platform data)
  const startingBalance = 20002010001.00;
  
  // Calculate Total Out as: Starting - Current
  const totalOut = startingBalance - currentBalance;
  
  console.log(`Starting Balance (set): ${startingBalance}`);
  console.log(`Current Balance: ${currentBalance}`);
  console.log(`Total Out (calculated): ${totalOut}`);
  console.log('');
  
  // Update meta
  await metaCol.updateOne(
    { _id: 'meta' },
    { 
      $set: { 
        baselineSumPiCore: startingBalance,
        lastFullScanAt: new Date()
      } 
    },
    { upsert: true }
  );
  
  console.log('✓ Baseline updated to 20,002,010,001.00');
  console.log('');
  
  // Now update the summary
  const { refreshPctSummary } = require('./dist/services/pct-summary');
  const summary = await refreshPctSummary();
  
  console.log('Refreshed Summary:');
  console.log(`  Starting Balance: ${summary.startingBalance}`);
  console.log(`  Current Balance: ${summary.currentBalance}`);
  console.log(`  Total Out: ${summary.totalOut}`);
  console.log('');
  
  await mongoose.disconnect();
  console.log('Done!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
