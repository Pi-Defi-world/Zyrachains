require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB,
    serverSelectionTimeoutMS: 30000
  });

  const mov = mongoose.connection.collection('pct-wallet-movements');
  const ev = mongoose.connection.collection('pct-balance-events');

  // Get ALL indexes
  const movIndexes = await mov.listIndexes().toArray();
  const evIndexes = await ev.listIndexes().toArray();
  console.log('Movements indexes:');
  movIndexes.forEach(i => console.log(`  ${i.name}:`, JSON.stringify(i.key), i.unique ? '(unique)' : ''));
  console.log('\nEvents indexes:');
  evIndexes.forEach(i => console.log(`  ${i.name}:`, JSON.stringify(i.key), i.unique ? '(unique)' : ''));

  // Check for TTL indexes
  const ttlIndexes = [...movIndexes, ...evIndexes].filter(i => i.expireAfterSeconds);
  if (ttlIndexes.length > 0) {
    console.log('\nTTL indexes found:');
    ttlIndexes.forEach(i => console.log(`  ${i.name}: expireAfterSeconds=${i.expireAfterSeconds}`));
  }

  // Check if streaming service is running
  const movSources = await mov.aggregate([
    { $group: { _id: '$source', count: { $sum: 1 } } }
  ]).toArray();
  console.log('\nMovements by source:', JSON.stringify(movSources));

  const evSources = await ev.aggregate([
    { $group: { _id: '$source', count: { $sum: 1 } } }
  ]).toArray();
  console.log('Events by source:', JSON.stringify(evSources));

  // Get date range of existing data
  const oldestMov = await mov.findOne({}, { sort: { detectedAt: 1 } });
  const newestMov = await mov.findOne({}, { sort: { detectedAt: -1 } });
  const oldestEv = await ev.findOne({}, { sort: { detectedAt: 1 } });
  const newestEv = await ev.findOne({}, { sort: { detectedAt: -1 } });

  console.log('\nMovement date range:');
  console.log('  Oldest:', oldestMov?.detectedAt);
  console.log('  Newest:', newestMov?.detectedAt);
  console.log('\nEvent date range:');
  console.log('  Oldest:', oldestEv?.detectedAt);
  console.log('  Newest:', newestEv?.detectedAt);

  // Count events/movements that have source='stream' vs source='historical'
  const movWithSource = await mov.countDocuments({ source: { $exists: true } });
  const evWithSource = await ev.countDocuments({ source: { $exists: true } });
  console.log('\nMovements with source field:', movWithSource);
  console.log('Events with source field:', evWithSource);

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
