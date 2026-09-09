require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB,
    serverSelectionTimeoutMS: 30000
  });

  console.log('=== Fix Movements Collection ===\n');

  const movementsCol = mongoose.connection.collection('pct-wallet-movements');

  // 1. Check current state
  const totalBefore = await movementsCol.countDocuments({});
  console.log('Total records before:', totalBefore);

  // 2. Find duplicates based on transactionHash + wallet
  console.log('\nFinding duplicates...');
  const dupGroups = await movementsCol.aggregate([
    { $group: { 
      _id: { transactionHash: '$transactionHash', wallet: '$wallet' },
      count: { $sum: 1 },
      ids: { $push: '$_id' }
    }},
    { $match: { count: { $gt: 1 } }
  ]).toArray();

  console.log('Duplicate groups found:', dupGroups.length);

  // 3. Remove duplicates (keep first, delete rest)
  let deletedCount = 0;
  for (const group of dupGroups) {
    const idsToDelete = group.ids.slice(1); // Keep first, delete rest
    if (idsToDelete.length > 0) {
      const result = await movementsCol.deleteMany({ _id: { $in: idsToDelete } });
      deletedCount += result.deletedCount;
    }
  }
  console.log('Deleted duplicates:', deletedCount);

  // 4. Drop all indexes except _id
  console.log('\nDropping old indexes...');
  const indexes = await movementsCol.listIndexes().toArray();
  for (const idx of indexes) {
    if (idx.name !== '_id_') {
      await movementsCol.dropIndex(idx.name);
      console.log('  Dropped:', idx.name);
    }
  }

  // 5. Create proper unique index
  console.log('\nCreating proper index...');
  await movementsCol.createIndex(
    { transactionHash: 1, wallet: 1 },
    { unique: true, name: 'transactionHash_wallet_1' }
  );
  console.log('✓ Created unique index on { transactionHash, wallet }');

  // 6. Summary
  const totalAfter = await movementsCol.countDocuments({});
  console.log('\n=== Summary ===');
  console.log('Total records before:', totalBefore);
  console.log('Total records after:', totalAfter);
  console.log('Duplicates removed:', totalBefore - totalAfter);

  await mongoose.disconnect();
  console.log('\n✓ Fix complete!');
}

main().catch(e => {
  console.error('Fatal Error:', e.message);
  process.exit(1);
});
