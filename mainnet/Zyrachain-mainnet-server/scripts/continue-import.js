require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB,
    serverSelectionTimeoutMS: 60000
  });

  console.log('=== Continue Import ===\n');

  const movementsCol = mongoose.connection.collection('pct-wallet-movements');
  const eventsCol = mongoose.connection.collection('pct-balance-events');

  // Get already processed wallets
  const processedWallets = new Set(
    await eventsCol.distinct('wallet', { source: 'historical' })
  );
  console.log(`Already processed: ${processedWallets.size} wallets\n`);

  // Get all wallets
  const coreCol = mongoose.connection.collection('core-team-addresses');
  const allWallets = await coreCol.find({}).project({ identifier: 1 }).toArray();
  const remaining = allWallets.filter(w => !processedWallets.has(w.identifier));
  console.log(`Remaining to import: ${remaining.length} wallets\n`);

  const axios = require('axios');
  const HORIZON = process.env.PCT_HORIZON_BASE_URL || 'https://api.mainnet.minepi.com';

  let totalEvents = 2436;
  let totalMovements = 13;
  let errors = 0;
  let success = 0;
  let i = 0;

  for (const w of remaining) {
    const walletId = w.identifier;
    if (!walletId) continue;
    i++;

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
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

            if (eff.type === 'account_debited') {
              await movementsCol.updateOne(
                { transactionHash: txHash, wallet: walletId },
                {
                  $setOnInsert: {
                    wallet: walletId, destination: eff.from || '', amount,
                    detectedAt: createdAt, ledger, transactionHash: txHash
                  }
                },
                { upsert: true }
              );
              walletMovements++;
              totalMovements++;
            }

            await eventsCol.updateOne(
              { transactionHash: txHash, wallet: walletId },
              {
                $setOnInsert: {
                  wallet: walletId, oldBalance: null, newBalance: null,
                  change: eff.type === 'account_debited' ? -amount : amount,
                  detectedAt: createdAt, ledger, transactionHash: txHash, source: 'historical'
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

        success++;
        if (success % 100 === 0) {
          console.log(`Progress: ${success}/${remaining.length}, Events: ${totalEvents}, Mov: ${totalMovements}`);
        }

        await new Promise(r => setTimeout(r, 150));
        break;

      } catch (e) {
        attempts++;
        errors++;
        if (attempts >= maxAttempts) {
          console.log(`Error ${walletId.slice(0, 12)}: ${e.message}`);
        } else {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }

    if (i >= 2000) {
      console.log('\nReached 2000 limit, stopping for now.');
      break;
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`Successfully processed: ${success}`);
  console.log(`Total errors: ${errors}`);
  console.log(`Total Events: ${totalEvents}`);
  console.log(`Total Movements: ${totalMovements}`);

  await mongoose.disconnect();
  console.log('\n✓ Done!');
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});