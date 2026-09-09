import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

const PI_ADDR = /^G[A-Z2-7]{55}$/;

async function main() {
  const uri = process.env.MONGODB_URI;
  const db = process.env.MONGODB_DB || 'infogram';
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, { dbName: db, serverSelectionTimeoutMS: 30000 });
  const dbConn = mongoose.connection;

  const coreCol = dbConn.collection('core-team-addresses');
  const cexCol = dbConn.collection('cex-addresses');
  const stateCol = dbConn.collection('pct-wallet-state');
  const eventsCol = dbConn.collection('pct-balance-events');
  const movementsCol = dbConn.collection('pct-wallet-movements');
  const metaCol = dbConn.collection('pct-monitor-meta');

  // 1. core-team-addresses audit
  const allCore = await coreCol.find({}).project({ identifier: 1, Name: 1, name: 1 }).toArray();
  const validAddrs = allCore.filter(d => PI_ADDR.test(String(d.identifier ?? '')));
  const invalidAddrs = allCore.filter(d => !PI_ADDR.test(String(d.identifier ?? '')));
  const unnamed = allCore.filter(d => !d.Name && !d.name);
  const named = allCore.filter(d => d.Name || d.name);

  console.log('\n=== core-team-addresses AUDIT ===');
  console.log(`Total documents:       ${allCore.length}`);
  console.log(`Valid PI addresses:    ${validAddrs.length}`);
  console.log(`Invalid addresses:     ${invalidAddrs.length}`);
  console.log(`Named wallets:         ${named.length}`);
  console.log(`Unnamed wallets:       ${unnamed.length}`);

  if (invalidAddrs.length > 0) {
    console.log('\n--- Invalid entries (sample 10) ---');
    invalidAddrs.slice(0, 10).forEach(d => console.log(`  ${d._id}: identifier="${d.identifier}"`));
  }

  // 2. Check for duplicates in core-team-addresses
  const ids = validAddrs.map(d => String(d.identifier));
  const idCount = new Map<string, number>();
  for (const id of ids) idCount.set(id, (idCount.get(id) || 0) + 1);
  const dups = [...idCount.entries()].filter(([, c]) => c > 1);
  if (dups.length > 0) {
    console.log(`\n--- DUPLICATE identifiers (${dups.length}) ---`);
    dups.slice(0, 10).forEach(([id, count]) => console.log(`  ${id}: ${count} occurrences`));
  }

  // 3. State coverage
  const withState = await stateCol.countDocuments({ identifier: { $in: ids } });
  const withoutState = ids.length - withState;
  console.log(`\n=== STATE COVERAGE ===`);
  console.log(`Wallets with state:    ${withState}`);
  console.log(`Wallets without state: ${withoutState}`);

  // 4. Balance distribution
  const balAgg = await stateCol.aggregate([
    { $match: { identifier: { $in: ids } } },
    { $group: {
      _id: null,
      total: { $sum: '$lastBalance' },
      avg: { $avg: '$lastBalance' },
      max: { $max: '$lastBalance' },
      min: { $min: '$lastBalance' },
      count: { $sum: 1 },
      zeroBal: { $sum: { $cond: [{ $eq: ['$lastBalance', 0] }, 1, 0] } },
    }}
  ]).toArray();
  const bal = balAgg[0] || {};
  console.log(`\n=== BALANCE SUMMARY ===`);
  console.log(`Wallets with balance:  ${bal.count || 0}`);
  console.log(`Total balance:         ${bal.total ?? 'N/A'}`);
  console.log(`Average balance:       ${bal.avg ?? 'N/A'}`);
  console.log(`Max balance:           ${bal.max ?? 'N/A'}`);
  console.log(`Min balance:           ${bal.min ?? 'N/A'}`);
  console.log(`Zero balance wallets:  ${bal.zeroBal ?? 0}`);

  // 5. Top 10 wallets
  const top10 = await stateCol.aggregate([
    { $match: { identifier: { $in: ids } } },
    { $sort: { lastBalance: -1 } },
    { $limit: 10 },
    { $project: { identifier: 1, lastBalance: 1, lastCheckedAt: 1 } }
  ]).toArray();
  console.log(`\n=== TOP 10 WALLETS ===`);
  top10.forEach((w, i) => console.log(`  ${i+1}. ${w.identifier}: ${w.lastBalance} (checked: ${w.lastCheckedAt})`));

  // 6. Events & movements
  const eventCount = await eventsCol.countDocuments({ wallet: { $in: ids } });
  const movementCount = await movementsCol.countDocuments({ wallet: { $in: ids } });
  const recentEvents = await eventsCol.countDocuments({
    wallet: { $in: ids },
    detectedAt: { $gte: new Date(Date.now() - 86400000) }
  });
  console.log(`\n=== EVENTS & MOVEMENTS ===`);
  console.log(`Total events:          ${eventCount}`);
  console.log(`Events (24h):          ${recentEvents}`);
  console.log(`Total movements:       ${movementCount}`);

  // 7. Meta
  const meta = await metaCol.findOne({ _id: 'meta' });
  console.log(`\n=== META ===`);
  console.log(`baselineSumPiCore:     ${meta?.baselineSumPiCore ?? 'NOT SET'}`);
  console.log(`baselineSumPiCex:      ${meta?.baselineSumPiCex ?? 'NOT SET'}`);
  console.log(`baselineSumPiTracked:  ${meta?.baselineSumPiTracked ?? 'NOT SET'}`);
  console.log(`lastFullScanAt:        ${meta?.lastFullScanAt ?? 'NEVER'}`);
  console.log(`scanLock:              ${!!meta?.scanLock}`);

  // 8. CEX audit
  const allCex = await cexCol.find({}).project({ identifier: 1, Name: 1, name: 1 }).toArray();
  const validCex = allCex.filter(d => PI_ADDR.test(String(d.identifier ?? '')));
  console.log(`\n=== CEX ADDRESSES AUDIT ===`);
  console.log(`Total CEX documents:   ${allCex.length}`);
  console.log(`Valid PI addresses:    ${validCex.length}`);

  await mongoose.disconnect();
  console.log('\nDiagnostic complete.');
}

main().catch(err => { console.error(err); process.exit(1); });
