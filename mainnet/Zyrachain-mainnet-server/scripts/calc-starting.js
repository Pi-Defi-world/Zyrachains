require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

const HORIZON = process.env.PCT_HORIZON_BASE_URL || 'https://api.mainnet.minepi.com';

async function getCreateAccountOps(walletId) {
  let cursor = undefined;
  let allCreates = [];
  while (true) {
    const params = { order: 'asc', limit: 200 };
    if (cursor) params.cursor = cursor;
    try {
      const r = await axios.get(`${HORIZON}/accounts/${walletId}/operations`, { params });
      const ops = r.data._embedded?.records || [];
      const creates = ops.filter(o => o.type === 'create_account');
      allCreates.push(...creates);
      if (ops.length < 200) break;
      cursor = ops[ops.length - 1].paging_token;
    } catch (e) {
      if (e.response?.status === 404) break;
      throw e;
    }
  }
  return allCreates;
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { 
    dbName: process.env.MONGO_DB, 
    serverSelectionTimeoutMS: 30000 
  });

  console.log('=== Calculate TRUE Starting Balance ===\n');

  const coreCol = mongoose.connection.collection('core-team-addresses');
  const wallets = await coreCol.find({}).project({ identifier: 1 }).toArray();
  const sample = wallets.slice(0, 5);

  console.log(`Testing with ${sample.length} wallets...\n`);

  let totalStarting = 0;
  for (const w of sample) {
    const id = w.identifier;
    if (!id) continue;
    try {
      const creates = await getCreateAccountOps(id);
      const walletStarting = creates.reduce((sum, o) => sum + Number(o.starting_balance || o.amount || 0), 0);
      console.log(`${id.slice(0,15)}... Creates: ${creates.length}, Starting: ${walletStarting}`);
      totalStarting += walletStarting;
    } catch (e) {
      console.error(`${id.slice(0,15)}... Error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nTotal starting for ${sample.length} wallets: ${totalStarting}`);
  console.log(`Projected for ${wallets.length} wallets: ${totalStarting * (wallets.length / sample.length)}`);
  console.log(`(Expected: 20,002,010,001)`);

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(console.error);
