require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 30000,
  });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB);

  // Check latest snapshots
  const snapshots = await db.collection('snapshots').find({}).sort({ updatedAt: -1 }).limit(10).toArray();
  console.log('=== Latest Snapshots ===');
  for (const s of snapshots) {
    console.log(`  ${s._id}  updatedAt=${s.updatedAt}`);
    if (s.data?.priceUsd) console.log(`    price=$${s.data.priceUsd}`);
    if (s.data?.latest_block) console.log(`    block=${s.data.latest_block}`);
    if (s.data?.tps) console.log(`    tps=${s.data.tps}`);
  }

  // Check streamer state
  const streamState = await db.collection('pct-stream-state').findOne({ _id: 'main' });
  console.log('\n=== Streamer State ===');
  console.log(`  lastRunAt: ${streamState?.lastRunAt}`);
  console.log(`  lastBalanceRefreshAt: ${streamState?.lastBalanceRefreshAt}`);
  console.log(`  lastEventAt: ${streamState?.lastEventAt}`);

  // Check summary
  const summary = await db.collection('pct-summary').findOne({ _id: 'summary' });
  console.log('\n=== PCT Summary ===');
  console.log(`  updatedAt: ${summary?.updatedAt}`);
  console.log(`  currentBalance: ${summary?.currentBalance}`);
  console.log(`  totalOut: ${summary?.totalOut}`);
  console.log(`  confirmedChanges: ${summary?.confirmedChanges}`);

  await client.close();
}

main().catch(console.error);
