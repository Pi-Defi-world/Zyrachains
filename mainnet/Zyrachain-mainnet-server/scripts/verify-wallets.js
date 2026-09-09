require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const db = process.env.MONGODB_DB;
  
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, { 
    dbName: db,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000
  });

  console.log('\n=== Wallet Verification ===\n');

  // Read CSV file
  const csvPath = path.join(__dirname, '..', 'created_wallets.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  const csvWallets = lines.slice(1).map(line => line.trim()).filter(Boolean); // Skip header
  
  console.log('1. CSV File Analysis:');
  console.log(`   Total wallets in CSV: ${csvWallets.length}`);
  console.log(`   Sample wallets: ${csvWallets.slice(0, 3).join(', ')}...`);
  console.log('');

  // Check core-team-addresses collection
  const coreCol = mongoose.connection.collection('core-team-addresses');
  const stateCol = mongoose.connection.collection('pct-wallet-state');
  
  const dbWallets = await coreCol.find({}).project({ identifier: 1 }).toArray();
  const dbWalletIds = dbWallets.map(d => d.identifier).filter(Boolean);
  
  console.log('2. Database Analysis:');
  console.log(`   Wallets in core-team-addresses: ${dbWalletIds.length}`);
  console.log('');

  // Find missing wallets
  const csvSet = new Set(csvWallets);
  const dbSet = new Set(dbWalletIds);
  
  const missingInDb = csvWallets.filter(w => !dbSet.has(w));
  const extraInDb = dbWalletIds.filter(w => !csvSet.has(w));
  
  console.log('3. Comparison:');
  console.log(`   Missing in DB (in CSV but not in core-team-addresses): ${missingInDb.length}`);
  console.log(`   Extra in DB (in core-team-addresses but not in CSV): ${extraInDb.length}`);
  console.log('');

  if (missingInDb.length > 0) {
    console.log('   Missing wallets (first 10):');
    missingInDb.slice(0, 10).forEach(w => console.log(`     - ${w}`));
    console.log('');
  }

  // Check which wallets have state data
  const withState = await stateCol.countDocuments({ identifier: { $in: csvWallets } });
  const withoutState = csvWallets.length - withState;
  
  console.log('4. State Data:');
  console.log(`   CSV wallets with state data: ${withState}`);
  console.log(`   CSV wallets without state data: ${withoutState}`);
  console.log('');

  // Sum balances of CSV wallets
  const csvBalanceAgg = await stateCol.aggregate([
    { $match: { identifier: { $in: csvWallets } } },
    { $group: { _id: null, total: { $sum: '$lastBalance' } } }
  ]).toArray();
  
  console.log('5. Balance Calculation:');
  console.log(`   Sum of CSV wallet balances: ${csvBalanceAgg[0]?.total || 0}`);
  console.log('');

  // Check top wallets by balance
  const topWallets = await stateCol.aggregate([
    { $match: { identifier: { $in: csvWallets } } },
    { $sort: { lastBalance: -1 } },
    { $limit: 10 }
  ]).toArray();
  
  console.log('6. Top 10 CSV Wallets by Balance:');
  topWallets.forEach((w, i) => {
    console.log(`   ${i+1}. ${w.identifier}: ${w.lastBalance}`);
  });
  console.log('');

  // Check for wallets with 0 balance
  const zeroBalance = await stateCol.countDocuments({ 
    identifier: { $in: csvWallets },
    lastBalance: 0 
  });
  console.log('7. Zero Balance Wallets:');
  console.log(`   CSV wallets with 0 balance: ${zeroBalance}`);
  console.log('');

  // Get meta baseline
  const metaCol = mongoose.connection.collection('pct-monitor-meta');
  const meta = await metaCol.findOne({ _id: 'meta' });
  console.log('8. Baseline Comparison:');
  console.log(`   baselineSumPiCore (meta): ${meta?.baselineSumPiCore}`);
  console.log(`   Actual CSV wallet sum: ${csvBalanceAgg[0]?.total || 0}`);
  console.log(`   Difference: ${(meta?.baselineSumPiCore || 0) - (csvBalanceAgg[0]?.total || 0)}`);
  console.log('');

  await mongoose.disconnect();
  console.log('Verification complete!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
