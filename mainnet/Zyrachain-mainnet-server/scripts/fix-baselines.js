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

  console.log('\n=== Fixing Baselines ===\n');

  // Get wallet IDs
  const coreIds = await coreCol.find({ identifier: { $regex: PI_ADDR } }).project({ identifier: 1 }).toArray();
  const cexIds = await cexCol.find({ identifier: { $regex: PI_ADDR } }).project({ identifier: 1 }).toArray();
  
  const coreWalletIds = coreIds.map(d => d.identifier).filter(Boolean);
  const cexWalletIds = cexIds.map(d => d.identifier).filter(Boolean);
  
  console.log('Core wallet IDs:', coreWalletIds.length);
  console.log('CEX wallet IDs:', cexWalletIds.length);

  // Calculate baselines
  const [baselineCoreAgg, baselineCexAgg, baselineTrackedAgg] = await Promise.all([
    stateCol.aggregate([
      { $match: { identifier: { $in: coreWalletIds } } },
      { $group: { _id: null, total: { $sum: '$lastBalance' } } }
    ]).toArray(),
    stateCol.aggregate([
      { $match: { identifier: { $in: cexWalletIds } } },
      { $group: { _id: null, total: { $sum: '$lastBalance' } } }
    ]).toArray(),
    stateCol.aggregate([
      { $group: { _id: null, total: { $sum: '$lastBalance' } } }
    ]).toArray()
  ]);

  const baselineCore = baselineCoreAgg[0]?.total || 0;
  const baselineCex = baselineCexAgg[0]?.total || 0;
  const baselineTracked = baselineTrackedAgg[0]?.total || 0;

  console.log('\nCalculated baselines:');
  console.log('  baselineSumPiCore:', baselineCore);
  console.log('  baselineSumPiCex:', baselineCex);
  console.log('  baselineSumPiTracked:', baselineTracked);

  // Update meta
  await metaCol.updateOne(
    { _id: 'meta' },
    { 
      $set: { 
        baselineSumPiCore: baselineCore,
        baselineSumPiCex: baselineCex,
        baselineSumPiTracked: baselineTracked,
        lastFullScanAt: new Date()
      } 
    },
    { upsert: true }
  );

  console.log('\n✓ Baselines updated successfully!');

  // Verify
  const updated = await metaCol.findOne({ _id: 'meta' });
  console.log('\nVerified meta:');
  console.log('  baselineSumPiCore:', updated?.baselineSumPiCore);
  console.log('  baselineSumPiCex:', updated?.baselineSumPiCex);
  console.log('  baselineSumPiTracked:', updated?.baselineSumPiTracked);

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
