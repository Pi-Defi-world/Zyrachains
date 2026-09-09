require('dotenv').config();
const axios = require('axios');

const HORIZON = process.env.PCT_HORIZON_BASE_URL || 'https://api.mainnet.minepi.com';
const wallets = [
  'GA22K33FA3GNZPTZX3PMWUQ7NQHVQBGG3RP35745MDXTFZFXN7X3Q2AC',
  'GA22QBINUV37CTRO6IDDW3XLRDSOQEXZ6QJLKN5UCFQSMJJCFS4GHMYG',
  'GA23V4LEO3MWTGZ6KLHKSS4LILQH2LMKMAHW2DUVQCMPU7NNHOHWK6Q7',
  'GA245IMB6FYKZMAQI6RL76HW67IKNGZWQWTAEC3RMTXOCKU6DVRVPPYJ',
  'GA24XKJSU4SN4PI2BXUXWUN357S4PJ3ITSTNTQLLXETEKLZDRBPJLZ55'
];

async function main() {
  console.log('=== Getting Starting Balance ===\n');
  let totalStarting = 0;
  
  for (const id of wallets) {
    try {
      const r = await axios.get(`${HORIZON}/accounts/${id}/operations`, {
        params: { order: 'asc', limit: 200 }
      });
      const ops = r.data._embedded?.records || [];
      const creates = ops.filter(o => o.type === 'create_account');
      const walletStarting = creates.reduce((sum, o) => sum + Number(o.starting_balance || o.amount || 0), 0);
      
      console.log(`${id.slice(0,15)}... Starting: ${walletStarting}, Creates: ${creates.length}`);
      totalStarting += walletStarting;
    } catch (e) {
      console.error(`${id.slice(0,15)}... Error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\nTotal starting for 5 wallets: ${totalStarting}`);
  console.log(`Projected for 10,001 wallets: ${totalStarting * 2000.2}`);
  console.log(`(Expected: 20,002,010,001)`);
}

main().catch(console.error);
