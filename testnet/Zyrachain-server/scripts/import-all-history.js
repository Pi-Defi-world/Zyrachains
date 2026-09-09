require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

const HORIZON = process.env.PCT_HORIZON_BASE_URL || 'https://api.mainnet.minepi.com';

async function getWalletEffects(walletId) {
  let cursor = undefined;
  let effects = [];
  while (true) {
    const params = { order: 'asc', limit: 200 };
    if (cursor) params.cursor = cursor;
    try {
      const r = await axios.get(`${HORIZON}/accounts/${walletId}/effects`, { params });
      const effs = r.data._embedded?.records || [];
      effects.push(...effs);
      if (effs.length < 200) break;
      cursor = effs[effs.length - 1].paging_token;
    } catch (e) {
      if (e.response?.status === 404) break;
      throw e;
    }
  }
  return effects;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB,
    serverSelectionTimeoutMS: 30000
  });

  console.log('=== Import ALL History ===\n');

  const coreCol = mongoose.connection.collection('core-team-addresses');
  const eventsCol = mongoose.connection.collection('pct-balance-events');
  const movementsCol = mongoose.connection.collection('pct-wallet-movements');

  const wallets = await coreCol.find({}).project({ identifier: 1 }).toArray();
  console.log(`Importing history for ${wallets.length} wallets...\n`);

  let totalEvents = 0;
  let totalMovements = 0;

  for (let i = 0; i < wallets.length; i++) {
    const walletId = wallets[i].identifier;
    if (!walletId) continue;

    try {
      const effects = await getWalletEffects(walletId);
      
      for (const eff of effects) {
        const type = eff.type;
        if (type !== 'account_credited' && type !== 'account_debited') continue;
        
        const amount = Number(eff.amount || 0);
        if (amount <= 0 || eff.asset_type !== 'native') continue;

        const txHash = eff.transaction_hash || null;
        const createdAt = eff.created_at ? new Date(eff.created_at) : new Date();
        const ledger = eff.paging_token ? Number(eff.paging_token.split('-')[0]) || null : null;

        if (type === 'account_debited') {
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
          totalMovements++;
        }

        await eventsCol.updateOne(
          { transactionHash: txHash, wallet: walletId },
          {
            $setOnInsert: {
              wallet: walletId,
              oldBalance: null,
              newBalance: null,
              change: type === 'account_debited' ? -amount : amount,
              detectedAt: createdAt,
              ledger: ledger,
              transactionHash: txHash,
              source: 'historical'
            }
          },
          { upsert: true }
        );
        totalEvents++;
      }

      if ((i + 1) % 100 === 0) {
        console.log(`Progress: ${i + 1}/${wallets.length}, Events: ${totalEvents}, Movements: ${totalMovements}`);
      }

      await new Promise(r => setTimeout(r, 100)); // 100ms delay between wallets
    } catch (e) {
      console.error(`Error on ${walletId.slice(0,15)}: ${e.message}`);
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`Total Events: ${totalEvents}`);
  console.log(`Total Movements: ${totalMovements}`);

  // Refresh summary
  const { refreshPctSummary } = require('./dist/services/pct-summary');
  const summary = await refreshPctSummary();

  console.log('\n=== Updated Summary ===');
  console.log('Starting Balance:', summary.startingBalance);
  console.log('Current Balance:', summary.currentBalance);
  console.log('Total Out:', summary.totalOut);
  console.log('Confirmed Changes:', summary.confirmedChanges);
  console.log('24h Net Change:', summary.netChange24h);

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
