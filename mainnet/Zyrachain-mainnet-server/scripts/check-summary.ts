import 'dotenv/config';
import mongoose from 'mongoose';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, {
    dbName: process.env.MONGODB_DB,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 30000,
  });

  // Check summary
  const summary = await mongoose.connection.collection('pct-summary').findOne({ _id: 'summary' });
  console.log('=== PCT Summary ===');
  console.log(JSON.stringify(summary, null, 2));

  // Check meta
  const meta = await mongoose.connection.collection('pct-monitor-meta').findOne({ _id: 'meta' });
  console.log('\n=== Meta ===');
  console.log(JSON.stringify(meta, null, 2));

  // Sample wallet states
  const coreCol = mongoose.connection.collection('core-team-addresses');
  const stateCol = mongoose.connection.collection('pct-wallet-state');
  const wallets = await coreCol.find({}).limit(10).project({ identifier: 1 }).toArray();
  const ids = wallets.map(w => String(w.identifier));
  const states = await stateCol.find({ identifier: { $in: ids } }).toArray();
  console.log('\n=== Sample Wallet States ===');
  for (const s of states) {
    console.log(`  ${String(s.identifier).slice(0, 12)}…  balance=${s.lastBalance}  checked=${s.lastCheckedAt}`);
  }

  // Count wallets with balance < 2M
  const decreased = await stateCol.countDocuments({ identifier: { $in: ids }, lastBalance: { $lt: 2_000_000 } });
  const zeroBal = await stateCol.countDocuments({ lastBalance: 0 });
  const totalWithState = await stateCol.countDocuments({});
  console.log(`\nWallets with state: ${totalWithState}`);
  console.log(`Wallets with 0 balance: ${zeroBal}`);

  await mongoose.disconnect();
}

main().catch(console.error);
