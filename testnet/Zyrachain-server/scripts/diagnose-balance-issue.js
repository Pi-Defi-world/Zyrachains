require('dotenv').config();
const mongoose = require('mongoose');

const PI_ADDR = /^G[A-Z2-7]{55}$/;

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const db = process.env.MONGODB_DB;
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, { 
    dbName: db,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000
  });

  const coreCol = mongoose.connection.collection('core-team-addresses');
  const cexCol = mongoose.connection.collection('cex-addresses');
  const stateCol = mongoose.connection.collection('pct-wallet-state');
  const metaCol = mongoose.connection.collection('pct-monitor-meta');

  console.log('=== DIAGNOSIS: Balance Issue ===\n');

  // 1. Check meta collection
  const meta = await metaCol.findOne({ _id: 'meta' });
  console.log('1. Meta Collection (pct-monitor-meta):');
  console.log('   baselineSumPiCore:', meta?.baselineSumPiCore);
  console.log('   baselineSumPiCex:', meta?.baselineSumPiCex);
  console.log('   baselineSumPiTracked:', meta?.baselineSumPiTracked);
  console.log('   lastFullScanAt:', meta?.lastFullScanAt);
  console.log('');

  // 2. Count wallets
  const coreCount = await coreCol.countDocuments({ identifier: { $regex: PI_ADDR } });
  const cexCount = await cexCol.countDocuments({ identifier: { $regex: PI_ADDR } });
  const stateCount = await stateCol.countDocuments({});
  console.log('2. Wallet Counts:');
  console.log('   Core team wallets (core-team-addresses):', coreCount);
  console.log('   CEX wallets (cex-addresses):', cexCount);
  console.log('   Wallets with state data (pct-wallet-state):', stateCount);
  console.log('');

  // 3. Sum of all balances in state
  const allBalanceAgg = await stateCol.aggregate([
    { $group: { _id: null, total: { $sum: '$lastBalance' } } }
  ]).toArray();
  console.log('3. Sum of ALL balances in pct-wallet-state:', allBalanceAgg[0]?.total || 0);
  console.log('');

  // 4. Sum of core team wallet balances
  const coreIds = await coreCol.find({ identifier: { $regex: PI_ADDR } }).project({ identifier: 1 }).toArray();
  const coreWalletIds = coreIds.map(d => d.identifier).filter(Boolean);
  console.log('4. Core team wallet IDs count:', coreWalletIds.length);

  const coreBalanceAgg = await stateCol.aggregate([
    { $match: { identifier: { $in: coreWalletIds } } },
    { $group: { _id: null, total: { $sum: '$lastBalance' } } }
  ]).toArray();
  console.log('   Sum of CORE wallet balances in state:', coreBalanceAgg[0]?.total || 0);
  console.log('');

  // 5. Sum of CEX wallet balances
  const cexIds = await cexCol.find({ identifier: { $regex: PI_ADDR } }).project({ identifier: 1 }).toArray();
  const cexWalletIds = cexIds.map(d => d.identifier).filter(Boolean);
  console.log('5. CEX wallet IDs count:', cexWalletIds.length);

  const cexBalanceAgg = await stateCol.aggregate([
    { $match: { identifier: { $in: cexWalletIds } } },
    { $group: { _id: null, total: { $sum: '$lastBalance' } } }
  ]).toArray();
  console.log('   Sum of CEX wallet balances in state:', cexBalanceAgg[0]?.total || 0);
  console.log('');

  // 6. Check if there are core wallets without state data
  const coreWithState = await stateCol.countDocuments({ identifier: { $in: coreWalletIds } });
  console.log('6. Core wallets WITH state data:', coreWithState);
  console.log('   Core wallets WITHOUT state data:', coreWalletIds.length - coreWithState);
  console.log('');

  // 7. Check top balances
  const topBalances = await stateCol.aggregate([
    { $match: { identifier: { $in: coreWalletIds } } },
    { $sort: { lastBalance: -1 } },
    { $limit: 10 }
  ]).toArray();
  console.log('7. Top 10 core wallet balances:');
  topBalances.forEach((w, i) => {
    console.log(`   ${i+1}. ${w.identifier}: ${w.lastBalance}`);
  });
  console.log('');

  // 8. Comparison
  console.log('8. Comparison:');
  console.log('   baselineSumPiCore (from meta):', meta?.baselineSumPiCore);
  console.log('   Actual sum of core balances:', coreBalanceAgg[0]?.total || 0);
  console.log('   Difference:', (meta?.baselineSumPiCore || 0) - (coreBalanceAgg[0]?.total || 0));
  console.log('');

  // 9. Total = Core + CEX?
  const totalCheck = (coreBalanceAgg[0]?.total || 0) + (cexBalanceAgg[0]?.total || 0);
  console.log('9. Total Check:');
  console.log('   Core + CEX balances:', totalCheck);
  console.log('   All balances (from #3):', allBalanceAgg[0]?.total || 0);
  console.log('   Difference (should be 0 if no other wallets):', totalCheck - (allBalanceAgg[0]?.total || 0));
  console.log('');

  await mongoose.disconnect();
  console.log('Diagnosis complete.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
