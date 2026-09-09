require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 30000,
  });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB);

  // Check summary
  const summary = await db.collection('pct-summary').findOne({ _id: 'summary' });
  console.log('=== PCT Summary ===');
  console.log(JSON.stringify(summary, null, 2));

  // Check meta
  const meta = await db.collection('pct-monitor-meta').findOne({ _id: 'meta' });
  console.log('\n=== Meta ===');
  console.log(JSON.stringify(meta, null, 2));

  // Sample wallet states
  const coreCol = db.collection('core-team-addresses');
  const stateCol = db.collection('pct-wallet-state');
  const wallets = await coreCol.find({}).limit(10).project({ identifier: 1 }).toArray();
  const ids = wallets.map(w => String(w.identifier));
  const states = await stateCol.find({ identifier: { $in: ids } }).toArray();
  console.log('\n=== Sample Wallet States ===');
  for (const s of states) {
    console.log(`  ${String(s.identifier).slice(0, 12)}  balance=${s.lastBalance}  checked=${s.lastCheckedAt}`);
  }

  // Count wallets with balance < 2M and == 0
  const zeroBal = await stateCol.countDocuments({ lastBalance: 0 });
  const totalWithState = await stateCol.countDocuments({});
  const allCore = await coreCol.find({}).project({ identifier: 1 }).toArray();
  const coreIds = allCore.map(w => String(w.identifier)).filter(Boolean);
  const coreWithState = await stateCol.countDocuments({ identifier: { $in: coreIds } });
  const coreDecreased = await stateCol.countDocuments({ identifier: { $in: coreIds }, lastBalance: { $lt: 2_000_000 } });
  const coreZero = await stateCol.countDocuments({ identifier: { $in: coreIds }, lastBalance: 0 });

  console.log(`\n=== Counts ===`);
  console.log(`Core wallets tracked: ${coreIds.length}`);
  console.log(`Wallets with state (all): ${totalWithState}`);
  console.log(`Core wallets with state: ${coreWithState}`);
  console.log(`Core wallets with 0 balance: ${coreZero}`);
  console.log(`Core wallets with balance < 2M: ${coreDecreased}`);

  await client.close();
}

main().catch(console.error);
