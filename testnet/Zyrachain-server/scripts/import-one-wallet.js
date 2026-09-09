require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

const HORIZON = process.env.PCT_HORIZON_BASE_URL || 'https://api.mainnet.minepi.com';
const TEST_WALLET = 'GA22K33FA3GNZPTZX3PMWUQ7NQHVQBGG3RP35745MDXTFZFXN7X3Q2AC';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB,
    serverSelectionTimeoutMS: 30000
  });

  console.log('=== Import Test: 1 Wallet ===\n');
  console.log('Wallet:', TEST_WALLET.slice(0, 20) + '...\n');

  const eventsCol = mongoose.connection.collection('pct-balance-events');
  const movementsCol = mongoose.connection.collection('pct-wallet-movements');

  // Get ALL effects (balance changes) for this wallet
  let cursor = undefined;
  let totalEffects = 0;
  let totalOut = 0;
  let pageCount = 0;

  console.log('Fetching all historical data...\n');

  while (true) {
    const params = { order: 'asc', limit: 200 };
    if (cursor) params.cursor = cursor;

    try {
      const r = await axios.get(`${HORIZON}/accounts/${TEST_WALLET}/effects`, { params });
      const effects = r.data._embedded?.records || [];

      if (effects.length === 0) break;

      for (const eff of effects) {
        const type = eff.type;
        if (type === 'account_credited' || type === 'account_debited') {
          const amount = Number(eff.amount || 0);
          if (amount > 0 && eff.asset_type === 'native') {
            totalEffects++;
            if (type === 'account_debited') {
              totalOut += amount;
              await movementsCol.updateOne(
                { transactionHash: eff.transaction_hash, wallet: TEST_WALLET },
                {
                  $setOnInsert: {
                    wallet: TEST_WALLET,
                    destination: eff.from || '',
                    amount: amount,
                    detectedAt: new Date(eff.created_at),
                    ledger: Number(eff.paging_token?.split('-')[0]) || null,
                    transactionHash: eff.transaction_hash
                  }
                },
                { upsert: true }
              );
            }

            await eventsCol.updateOne(
              { transactionHash: eff.transaction_hash, wallet: TEST_WALLET },
              {
                $setOnInsert: {
                  wallet: TEST_WALLET,
                  oldBalance: null,
                  newBalance: null,
                  change: type === 'account_debited' ? -amount : amount,
                  detectedAt: new Date(eff.created_at),
                  ledger: Number(eff.paging_token?.split('-')[0]) || null,
                  transactionHash: eff.transaction_hash,
                  source: 'historical'
                }
              },
              { upsert: true }
            );
          }
        }
      }

      if (effects.length < 200) break;
      cursor = effects[effects.length - 1].paging_token;
      pageCount++;

      if (pageCount % 5 === 0) {
        console.log(`  Page ${pageCount}, Effects: ${totalEffects}, Out: ${totalOut}`);
      }
    } catch (e) {
      console.error('Error:', e.message);
      break;
    }
  }

  console.log('\n=== Results ===');
  console.log('Total effects (balance changes):', totalEffects);
  console.log('Total outgoing:', totalOut);
  console.log('Pages fetched:', pageCount);

  // Get counts
  const eventCount = await eventsCol.countDocuments({ wallet: TEST_WALLET });
  const movementCount = await movementsCol.countDocuments({ wallet: TEST_WALLET });

  console.log('\nIn database:');
  console.log('  Events:', eventCount);
  console.log('  Movements:', movementCount);

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
