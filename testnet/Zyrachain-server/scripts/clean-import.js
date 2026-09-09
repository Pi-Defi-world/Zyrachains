require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB,
    serverSelectionTimeoutMS: 30000
  });

  console.log('=== Clean Import ===\n');

  const movementsCol = mongoose.connection.collection('pct-wallet-movements');
  const eventsCol = mongoose.connection.collection('pct-balance-events');

  // 1. Delete all existing data
  console.log('1. Cleaning old data...');
  const delMovements = await movementsCol.deleteMany({});
  const delEvents = await eventsCol.deleteMany({});
  console.log(`   Deleted ${delMovements.deletedCount} movements`);
  console.log(`   Deleted ${delEvents.deletedCount} events\n`);

  // 2. Create proper index
  console.log('2. Creating index...');
  try {
    await movementsCol.createIndex(
      { transactionHash: 1, wallet: 1 },
      { unique: true, name: 'transactionHash_wallet_1' }
    );
    console.log('   ✓ Index created\n');
  } catch (e) {
    console.log('   Index may already exist:', e.message, '\n');
  }

  // 3. Get wallets to import
  const coreCol = mongoose.connection.collection('core-team-addresses');
  const wallets = await coreCol.find({}).project({ identifier: 1 }).toArray();
  console.log(`3. Ready to import ${wallets.length} wallets\n`);
  console.log('Starting import...\n');

  // 4. Import with axios
  const axios = require('axios');
  const HORIZON = process.env.PCT_HORIZON_BASE_URL || 'https://api.mainnet.minepi.com';

  let totalEvents = 0;
  let totalMovements = 0;

  for (let i = 0; i < wallets.length; i++) {
    const walletId = wallets[i].identifier;
    if (!walletId) continue;

    try {
      // Get effects for this wallet
      let cursor = undefined;
      let walletEvents = 0;
      let walletMovements = 0;

      while (true) {
        const params = { order: 'asc', limit: 200 };
        if (cursor) params.cursor = cursor;

        const r = await axios.get(`${HORIZON}/accounts/${walletId}/effects`, { params });
        const effects = r.data._embedded?.records || [];

        for (const eff of effects) {
          if (eff.type !== 'account_credited' && eff.type !== 'account_debited') continue;
          if (eff.asset_type !== 'native') continue;

          const amount = Number(eff.amount || 0);
          if (amount <= 0) continue;

          const txHash = eff.transaction_hash || null;
          const createdAt = eff.created_at ? new Date(eff.created_at) : new Date();
          const ledger = eff.paging_token ? Number(eff.paging_token.split('-')[0]) || null : null;

          // Insert movement if debited
          if (eff.type === 'account_debited') {
            await movementsCol.updateOne(
              { transactionHash: txHash, wallet: walletId },
              {
                $setOnInsert: {
                  wallet: walletId,
                  destination: eff.from || '',
                  amount: amount,
                  detectedAt: createdAt,
                  ledger: ledger,
                  transactionHash: txHash
                }
              },
              { upsert: true }
            );
            walletMovements++;
            totalMovements++;
          }

          // Insert event
          await eventsCol.updateOne(
            { transactionHash: txHash, wallet: walletId },
            {
              $setOnInsert: {
                wallet: walletId,
                oldBalance: null,
                newBalance: null,
                change: eff.type === 'account_debited' ? -amount : amount,
                detectedAt: createdAt,
                ledger: ledger,
                transactionHash: txHash,
                source: 'historical'
              }
            },
            { upsert: true }
          );
          walletEvents++;
          totalEvents++;
        }

        if (effects.length < 200) break;
        cursor = effects[effects.length - 1].paging_token;
      }

      if ((i + 1) % 100 === 0) {
        console.log(`  Progress: ${i + 1}/${wallets.length}, Events: ${totalEvents}, Movements: ${totalMovements}`);
      }

      await new Promise(r => setTimeout(r, 100));
    } catch (e) {
      console.error(`  Error on ${walletId.slice(0, 15)}: ${e.message}`);
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`Total Events: ${totalEvents}`);
  console.log(`Total Movements: ${totalMovements}`);

  // 5. Refresh summary
  console.log('\nRefreshing summary...');
  const { refreshPctSummary } = require('./dist/services/pct-summary');
  const summary = await refreshPctSummary();

  console.log('\n=== Updated Summary ===');
  console.log('Starting Balance:', summary.startingBalance);
  console.log('Current Balance:', summary.currentBalance);
  console.log('Total Out:', summary.totalOut);
  console.log('Confirmed Changes:', summary.confirmedChanges);
  console.log('24h Net Change:', summary.netChange24h);

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
