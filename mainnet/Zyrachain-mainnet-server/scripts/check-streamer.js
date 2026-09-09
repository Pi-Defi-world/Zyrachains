require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 30000,
  });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB);

  // Check streamer state
  const streamState = await db.collection('pct-stream-state').findOne({ _id: 'main' });
  console.log('=== Streamer State ===');
  console.log(JSON.stringify(streamState, null, 2));

  // Check meta
  const meta = await db.collection('pct-monitor-meta').findOne({ _id: 'meta' });
  console.log('\n=== Meta ===');
  console.log(JSON.stringify(meta, null, 2));

  // Check summary
  const summary = await db.collection('pct-summary').findOne({ _id: 'summary' });
  console.log('\n=== Summary ===');
  console.log(JSON.stringify(summary, null, 2));

  // Check latest event
  const latestEvent = await db.collection('pct-balance-events').find({}).sort({ detectedAt: -1 }).limit(1).toArray();
  console.log('\n=== Latest Balance Event ===');
  console.log(JSON.stringify(latestEvent[0], null, 2));

  // Check latest movement
  const latestMovement = await db.collection('pct-wallet-movements').find({}).sort({ detectedAt: -1 }).limit(1).toArray();
  console.log('\n=== Latest Movement ===');
  console.log(JSON.stringify(latestMovement[0], null, 2));

  // Check a few wallet states
  const coreCol = db.collection('core-team-addresses');
  const stateCol = db.collection('pct-wallet-state');
  const wallets = await coreCol.find({}).limit(5).project({ identifier: 1 }).toArray();
  const ids = wallets.map(w => String(w.identifier));
  const states = await stateCol.find({ identifier: { $in: ids } }).toArray();
  console.log('\n=== Sample Wallet States ===');
  for (const s of states) {
    console.log(`  ${String(s.identifier).slice(0, 12)}  balance=${s.lastBalance}  checked=${s.lastCheckedAt}`);
  }

  await client.close();
}

main().catch(console.error);
