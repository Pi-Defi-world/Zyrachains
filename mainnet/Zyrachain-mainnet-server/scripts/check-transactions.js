require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const db = process.env.MONGODB_DB;  
  
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, { 
    dbName: db,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000
  });

  console.log('\n=== Transaction History Check ===\n');

  const eventsCol = mongoose.connection.collection('pct-balance-events');
  const movementsCol = mongoose.connection.collection('pct-wallet-movements');
  const coreCol = mongoose.connection.collection('core-team-addresses');

  // Get core wallet IDs
  const coreIds = await coreCol.find({}).project({ identifier: 1 }).toArray();
  const coreWalletIds = coreIds.map(d => d.identifier).filter(Boolean);

  console.log('1. Event Counts:');
  const totalEvents = await eventsCol.countDocuments({});
  const coreEvents = await eventsCol.countDocuments({ wallet: { $in: coreWalletIds } });
  console.log(`   Total events in DB: ${totalEvents}`);
  console.log(`   Core wallet events: ${coreEvents}`);
  console.log(`   CEX wallet events: ${totalEvents - coreEvents}`);
  console.log('');

  console.log('2. Movement Counts:');
  const totalMovements = await movementsCol.countDocuments({});
  const coreMovements = await movementsCol.countDocuments({ wallet: { $in: coreWalletIds } });
  console.log(`   Total movements in DB: ${totalMovements}`);
  console.log(`   Core wallet movements: ${coreMovements}`);
  console.log('');

  // Check total outflow from movements
  const totalOutAgg = await movementsCol.aggregate([
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]).toArray();
  console.log('3. Total Out (from movements):');
  console.log(`   Sum of all movements: ${totalOutAgg[0]?.total || 0}`);
  console.log('');

  // Check earliest and latest events
  const earliestEvent = await eventsCol.findOne({}, { sort: { detectedAt: 1 } });
  const latestEvent = await eventsCol.findOne({}, { sort: { detectedAt: -1 } });
  console.log('4. Event Time Range:');
  console.log(`   Earliest event: ${earliestEvent?.detectedAt}`);
  console.log(`   Latest event: ${latestEvent?.detectedAt}`);
  console.log('');

  // Check if there are large movements we're missing
  const largeMovements = await movementsCol.aggregate([
    { $match: { amount: { $gt: 1000000 } } },
    { $sort: { amount: -1 } },
    { $limit: 10 }
  ]).toArray();
  console.log('5. Top 10 Largest Movements:');
  largeMovements.forEach((m, i) => {
    const w = m.wallet || '';
    const d = m.destination || '';
    console.log(`   ${i+1}. Amount: ${m.amount}, Wallet: ${w.slice(0,20)}..., Dest: ${d.slice(0,20)}...`);
  });
  console.log('');

  // Check events with large changes
  const largeChanges = await eventsCol.aggregate([
    { $match: { change: { $lt: -1000000 } } },
    { $sort: { change: 1 } },
    { $limit: 10 }
  ]).toArray();
  console.log('6. Top 10 Largest Decreases (events):');
  largeChanges.forEach((e, i) => {
    console.log(`   ${i+1}. Change: ${e.change}, Old: ${e.oldBalance}, New: ${e.newBalance}`);
  });
  console.log('');

  // Get all-time total change for core wallets
  const coreTotalChangeAgg = await eventsCol.aggregate([
    { $match: { wallet: { $in: coreWalletIds } } },
    { $group: { _id: null, total: { $sum: '$change' } } }
  ]).toArray();
  console.log('7. Core Wallet Total Change (all time):');
  console.log(`   Total change: ${coreTotalChangeAgg[0]?.total || 0}`);
  console.log('');

  // Summary comparison with "other platform"
  console.log('8. Comparison with Other Platform:');
  console.log('   Other platform shows:');
  console.log('     Starting Balance: 20,002,010,001.00');
  console.log('     Current Balance: 17,832,232,345.84');
  console.log('     Total Out: -2,169,777,655.16');
  console.log('');
  console.log('   Our data shows:');
  console.log('     Starting Balance (baseline): 17,831,702,899.26');
  console.log('     Current Balance: 17,831,491,162.26');
  console.log(`     Total Out (from movements): -${totalOutAgg[0]?.total || 0}`);
  console.log('');
  console.log('   ANALYSIS:');
  console.log('   - Other platform starting balance (~20B) appears to be');
  console.log('     the THEORETICAL 20% allocation (100B x 20% = 20B)');
  console.log('   - Actual wallet balances sum to ~17.8B');
  console.log('   - The ~2.2B difference may represent:');
  console.log('     * Wallets with 0 balance (not in our CSV?)');
  console.log('     * Uncreated/missing wallets');
  console.log('     * Different baseline date');
  console.log('   - Our Total Out (-230K) vs Other (-2.17B) suggests');
  console.log('     we may be missing historical transaction data');

  await mongoose.disconnect();
  console.log('\nCheck complete!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
