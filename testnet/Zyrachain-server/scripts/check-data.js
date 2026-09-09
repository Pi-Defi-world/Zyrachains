require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB,
    serverSelectionTimeoutMS: 30000
  });

  const mov = mongoose.connection.collection('pct-wallet-movements');
  const ev = mongoose.connection.collection('pct-balance-events');
  const state = mongoose.connection.collection('pct-wallet-state');

  // Sample movement
  const sample = await mov.findOne({});
  console.log('Sample movement:', JSON.stringify(sample, null, 2));

  // Total counts
  const tMov = await mov.estimatedDocumentCount();
  const tEv = await ev.countDocuments({ source: 'historical' });
  console.log('\nTotal movements:', tMov);
  console.log('Historical events:', tEv);

  // Check amount sum
  const amtAgg = await mov.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]).toArray();
  console.log('Total amount in movements:', amtAgg[0]?.total);

  // Sample of larger amounts
  const largest = await mov.find().sort({ amount: -1 }).limit(5).toArray();
  console.log('\n5 largest movements:');
  largest.forEach(l => console.log(`  ${l.amount} - ${(l.wallet || '').slice(0, 20)}`));

  // Check events for core wallet
  const core = mongoose.connection.collection('core-team-addresses');
  const coreIds = await core.find({}).project({ identifier: 1 }).limit(5).toArray();
  const firstWallet = coreIds[0]?.identifier;
  if (firstWallet) {
    const walletEvents = await ev.countDocuments({ wallet: firstWallet });
    const walletMov = await mov.countDocuments({ wallet: firstWallet });
    console.log(`\nEvents for ${firstWallet.slice(0, 20)}:`, walletEvents);
    console.log(`Movements for ${firstWallet.slice(0, 20)}:`, walletMov);
    const walletMovData = await mov.find({ wallet: firstWallet }).toArray();
    console.log('Movement amounts:', walletMovData.map(m => m.amount));
  }

  // Check core wallet count with events
  const coreAll = await core.find({}).project({ identifier: 1 }).toArray();
  const coreIdsList = coreAll.map(d => d.identifier).filter(Boolean);
  const coreWithEvents = await ev.distinct('wallet', { wallet: { $in: coreIdsList } });
  console.log('\nCore wallets with events:', coreWithEvents.length);

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
