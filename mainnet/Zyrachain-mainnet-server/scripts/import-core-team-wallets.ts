/**
 * Bulk upsert Pi Core Team wallets into MongoDB `core-team-addresses`.
 *
 * Usage:
 *   pnpm run import:core-team-wallets -- scripts/data/core-team-wallets.json
 *
 * JSON shape: [ "G...", "G..." ] or { "addresses": [ ... ] }
 *
 * Optional env:
 *   CORE_TEAM_IMPORT_REPLACE=true  — delete ALL documents in core-team-addresses before import (dangerous)
 */
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const PI_ADDRESS = /^G[A-Z2-7]{55}$/;

async function main(): Promise<void> {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  dotenv.config();
  // Import after dotenv so MONGODB_URI is available at module load time
  const { default: connectToDatabase } = await import('../zyrachain-lib/lib/mongodb');

  const fileArg = process.argv[2] || path.join('scripts', 'data', 'core-team-wallets.json');
  const abs = path.isAbsolute(fileArg) ? fileArg : path.resolve(process.cwd(), fileArg);

  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    console.error('Provide a .json or .csv file containing Pi addresses.');
    process.exit(1);
  }

  const raw = fs.readFileSync(abs, 'utf8');
  const ext = path.extname(abs).toLowerCase();

  let addresses: string[] = [];
  if (ext === '.csv') {
    // Accept either "account" header or raw one-address-per-line CSV
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      // first column only
      const first = line.split(',')[0]?.trim() || '';
      if (!first || first.toLowerCase() === 'account') continue;
      addresses.push(first);
    }
  } else {
    const parsed = JSON.parse(raw) as unknown;
    addresses = Array.isArray(parsed)
      ? (parsed as string[])
      : typeof parsed === 'object' &&
          parsed !== null &&
          'addresses' in parsed &&
          Array.isArray((parsed as { addresses: unknown }).addresses)
        ? ((parsed as { addresses: string[] }).addresses)
        : [];
  }

  const valid = [...new Set(addresses.map((a) => String(a).trim()).filter((a) => PI_ADDRESS.test(a)))];
  if (valid.length === 0) {
    console.error('No valid Pi addresses (expected G + 55 base32 chars).');
    process.exit(1);
  }

  console.log(`Connecting… (${valid.length} unique addresses from ${abs})`);
  await connectToDatabase();
  const col = mongoose.connection.collection('core-team-addresses');

  const replace = process.env.CORE_TEAM_IMPORT_REPLACE === 'true';
  if (replace) {
    const del = await col.deleteMany({});
    console.log(`CORE_TEAM_IMPORT_REPLACE: removed ${del.deletedCount} documents`);
  }

  const now = new Date();
  const BATCH = 500;

  for (let i = 0; i < valid.length; i += BATCH) {
    const slice = valid.slice(i, i + BATCH);
    const ops = slice.map((identifier, j) => {
      const n = i + j + 1;
      return {
        updateOne: {
          filter: { identifier },
          update: {
            $set: {
              identifier,
              Name: `PCT Wallet ${n}`,
              updatedAt: now,
            },
            $setOnInsert: { createdAt: now },
          },
          upsert: true,
        },
      };
    });
    await col.bulkWrite(ops, { ordered: false });
    console.log(`Upserted ${Math.min(i + BATCH, valid.length)} / ${valid.length}`);
  }

  console.log('Done.');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
