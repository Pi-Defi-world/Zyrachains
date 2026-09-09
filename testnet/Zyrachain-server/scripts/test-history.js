require('dotenv').config();
const axios = require('axios');

const HORIZON = process.env.PCT_HORIZON_BASE_URL || 'https://api.mainnet.minepi.com';
const wallets = [
  'GA22K33FA3GNZPTZX3PMWUQ7NQHVQBGG3RP35745MDXTFZFXN7X3Q2AC',
  'GA22QBINUV37CTRO6IDDW3XLRDSOQEXZ6QJLKN5UCFQSMJJCFS4GHMYG', 
  'GA23V4LEO3MWTGZ6KLHKSS4LILQH2LMKMAHW2DUVQCMPU7NNHOHWK6Q7'
];

async function testWallet(walletId) {
  console.log(`\nTesting ${walletId.slice(0, 20)}...`);
  try {
    const r = await axios.get(`${HORIZON}/accounts/${walletId}/operations`, {
      params: { order: 'asc', limit: 200 }
    });
    const ops = r.data._embedded?.records || [];
    const creates = ops.filter(o => o.type === 'create_account');
    const payments = ops.filter(o => o.type === 'payment');
    
    console.log(`  Total operations: ${ops.length}`);
    console.log(`  Create_account ops: ${creates.length}`);
    console.log(`  Payment ops: ${payments.length}`);
    
    if (creates.length > 0) {
      console.log(`  First create: ${creates[0].created_at}, amount: ${creates[0].starting_balance || creates[0].amount}`);
    }
    if (payments.length > 0) {
      console.log(`  First payment: ${payments[0].created_at}, amount: ${payments[0].amount}`);
    }
  } catch (e) {
    console.error(`  Error: ${e.message}`);
  }
}

async function main() {
  console.log('=== Testing History API ===');
  for (const w of wallets) {
    await testWallet(w);
    await new Promise(r => setTimeout(r, 1000)); // 1 sec delay
  }
  console.log('\nDone!');
}

main().catch(console.error);
