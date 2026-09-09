/**
 * Copy all user collections (and indexes) from a remote MongoDB into the local DB.
 *
 * Setup:
 *   1. Keep MONGODB_URI pointing at local (e.g. mongodb://localhost:27017/Zyrachain)
 *   2. Add SOURCE_MONGODB_URI to .env with your Atlas / remote URI
 *      Example: mongodb+srv://user:pass@cluster.mongodb.net/infogram
 *
 * IMPORTANT — database name:
 *   - The database is taken from the path in each URI (…/dbname).
 *   - If your URI has NO database path (common mistake), the driver defaults to "test"
 *     and your real data (e.g. in "infogram") will NOT sync.
 *   - Fix: put the DB name in the URI, OR set overrides:
 *       SOURCE_DATABASE=infogram
 *       TARGET_DATABASE=Zyrachain
 *
 * Run (from Zyrachain-server/):
 *   pnpm run db:sync-from-remote
 *
 * Optional env:
 *   DRY_RUN=1              — only list collections and counts, no writes
 *   LIST_SOURCE_DATABASES=1 — print database names on the remote cluster (needs listDatabases permission)
 *   SOURCE_DATABASE=name   — force source DB (overrides path in SOURCE_MONGODB_URI)
 *   TARGET_DATABASE=name   — force target DB (overrides path in MONGODB_URI)
 */

const path = require('path');
const { MongoClient, MongoBulkWriteError } = require('mongodb');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const BATCH_SIZE = 500;
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const LIST_SOURCE_DATABASES =
  process.env.LIST_SOURCE_DATABASES === '1' || process.env.LIST_SOURCE_DATABASES === 'true';

/**
 * Extract database name from standard mongodb / mongodb+srv URIs.
 * Returns undefined if there is no path segment (caller should use client.db() default).
 */
function databaseNameFromUri(uri) {
  if (!uri || typeof uri !== 'string') return undefined;
  const noQuery = uri.split('?')[0].trim();
  const withoutProtocol = noQuery.replace(/^mongodb(\+srv)?:\/\//i, '');
  const at = withoutProtocol.lastIndexOf('@');
  const hostAndPath = at >= 0 ? withoutProtocol.slice(at + 1) : withoutProtocol;
  const slash = hostAndPath.indexOf('/');
  if (slash === -1) return undefined;
  let name = hostAndPath.slice(slash + 1).trim();
  if (!name) return undefined;
  try {
    name = decodeURIComponent(name);
  } catch {
    /* keep raw */
  }
  if (name.includes('@')) return undefined;
  return name;
}

function resolveDbName(uri, override) {
  const o = override && String(override).trim();
  if (o) return o;
  const parsed = databaseNameFromUri(uri);
  return parsed !== undefined && parsed !== '' ? parsed : undefined;
}

function getDb(client, uri, override) {
  const name = resolveDbName(uri, override);
  if (name !== undefined && name !== '') {
    return client.db(name);
  }
  return client.db();
}

function isUserCollection(name) {
  if (!name || name.startsWith('system.')) return false;
  return true;
}

async function copyCollection(sourceColl, targetColl, label) {
  const total = await sourceColl.countDocuments();
  if (total === 0) {
    console.log(`   ${label}: 0 documents (skipped insert)`);
    return { inserted: 0, total: 0 };
  }

  let inserted = 0;
  const cursor = sourceColl.find({}).batchSize(BATCH_SIZE);

  let batch = [];
  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= BATCH_SIZE) {
      if (!DRY_RUN) {
        inserted += await flushBatch(targetColl, batch, label);
      } else {
        inserted += batch.length;
      }
      batch = [];
      process.stdout.write(`   ${label}: ${inserted}/${total}\r`);
    }
  }
  if (batch.length) {
    if (!DRY_RUN) {
      inserted += await flushBatch(targetColl, batch, label);
    } else {
      inserted += batch.length;
    }
  }
  console.log(`   ${label}: ${inserted} documents copied (source had ${total})`);
  if (!DRY_RUN && inserted !== total) {
    console.warn(`   ⚠ ${label}: inserted ${inserted} but source count was ${total} — check errors above`);
  }
  return { inserted, total };
}

async function flushBatch(targetColl, batch, label) {
  try {
    const res = await targetColl.insertMany(batch, { ordered: false });
    return res.insertedCount ?? batch.length;
  } catch (err) {
    if (err instanceof MongoBulkWriteError || err?.name === 'MongoBulkWriteError') {
      const n = err.result?.insertedCount ?? 0;
      const we = err.writeErrors || [];
      console.warn(`   ${label}: bulk write partial success, inserted ${n}, writeErrors: ${we.length}`);
      if (we.length && we.length <= 5) {
        we.forEach((w) => console.warn(`      — ${w.errmsg || JSON.stringify(w)}`));
      } else if (we.length > 5) {
        console.warn(`      — (showing first 3 of ${we.length})`);
        we.slice(0, 3).forEach((w) => console.warn(`      — ${w.errmsg || JSON.stringify(w)}`));
      }
      return n;
    }
    console.error(`   ${label}: insertMany failed:`, err.message || err);
    throw err;
  }
}

async function copyIndexes(sourceColl, targetColl, label) {
  const indexes = await sourceColl.indexes();
  for (const spec of indexes) {
    if (spec.name === '_id_') continue;
    const options = { name: spec.name };
    if (spec.unique) options.unique = true;
    if (spec.sparse) options.sparse = true;
    if (spec.expireAfterSeconds != null) options.expireAfterSeconds = spec.expireAfterSeconds;
    if (spec.partialFilterExpression) options.partialFilterExpression = spec.partialFilterExpression;
    if (!DRY_RUN) {
      try {
        await targetColl.createIndex(spec.key, options);
      } catch (e) {
        console.warn(`   ${label}: index "${spec.name}" skipped: ${e.message || e}`);
      }
    }
  }
  const n = indexes.filter((i) => i.name !== '_id_').length;
  if (n) console.log(`   ${label}: ${n} extra index(es) created`);
}

async function tryListRemoteDatabases(client) {
  try {
    const admin = client.db('admin');
    const { databases } = await admin.command({ listDatabases: 1, nameOnly: true });
    const names = databases.map((d) => d.name).filter((n) => !n.startsWith('system'));
    console.log('Remote cluster databases (for SOURCE_DATABASE if needed):', names.join(', '));
  } catch (e) {
    console.warn('Could not list remote databases (permission or network):', e.message || e);
  }
}

/**
 * Connect and print actionable help when mongodb+srv DNS (SRV) fails on this machine.
 */
async function connectMongoClient(uri, label) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    return client;
  } catch (err) {
    const isSrvDns =
      err?.syscall === 'querySrv' ||
      (typeof err?.message === 'string' && err.message.includes('querySrv'));
    if (isSrvDns) {
      console.error(`\n❌ [${label}] MongoDB connection failed: ${err.message || err}`);
      console.error(`
Your URI uses mongodb+srv://, which requires a DNS SRV lookup (e.g. _mongodb._tcp.*).
"querySrv ECONNREFUSED" / ENOTFOUND here is almost always a local network/DNS issue, not the sync script.

Fix options:
  1) Atlas → your cluster → Connect → Drivers → use the "mongodb://" standard connection string
     (hosts + ports + replicaSet=… + tls=true), not the SRV string. Paste that as SOURCE_MONGODB_URI.

  2) Check VPN / corporate firewall / DNS filtering — SRV queries are sometimes blocked.

  3) Try another resolver, e.g. set DNS to 1.1.1.1 or 8.8.8.8, or test from another network.

  4) Windows: in PowerShell, run:
       nslookup -type=SRV _mongodb._tcp.YOUR_HOST.mongodb.net
     (replace YOUR_HOST with the host from your URI, without mongodb+srv prefix)

  5) Optional: install MongoDB Database Tools, set MONGO_TOOLS_BIN in .env to the Tools "bin" folder,
     then run: pnpm run db:migrate-dump-restore  (often works with the same standard mongodb:// URI)
`);
      process.exit(1);
    }
    throw err;
  }
}

async function main() {
  const sourceUri = process.env.SOURCE_MONGODB_URI;
  const targetUri = process.env.MONGODB_URI || process.env.TARGET_MONGODB_URI;

  if (!sourceUri) {
    console.error(
      'Missing SOURCE_MONGODB_URI. Add it to .env, e.g.:\n' +
        '  SOURCE_MONGODB_URI=mongodb+srv://USER:PASS@HOST/your_actual_db_name\n' +
        'If the URI has no /dbname, set SOURCE_DATABASE=your_actual_db_name'
    );
    process.exit(1);
  }
  if (!targetUri) {
    console.error('Missing MONGODB_URI (local target).');
    process.exit(1);
  }

  const parsedSource = databaseNameFromUri(sourceUri);
  const parsedTarget = databaseNameFromUri(targetUri);
  const sourceOverride = process.env.SOURCE_DATABASE || process.env.SOURCE_DB_NAME;
  const targetOverride = process.env.TARGET_DATABASE || process.env.TARGET_DB_NAME;

  console.log('URI path database names (before overrides):', {
    sourceFromUri: parsedSource ?? '(none — driver default, often "test")',
    targetFromUri: parsedTarget ?? '(none — driver default)',
  });
  console.log('Overrides:', {
    SOURCE_DATABASE: sourceOverride || '(not set)',
    TARGET_DATABASE: targetOverride || '(not set)',
  });

  if (/^mongodb\+srv:/i.test(sourceUri)) {
    console.log(
      '\n⚠ SOURCE uses mongodb+srv:// — DNS SRV must work on this PC. If you get querySrv ECONNREFUSED,\n' +
        '  replace SOURCE_MONGODB_URI with Atlas’s standard mongodb:// string (Connect → Drivers).\n' +
        '  Or use: pnpm run db:migrate-dump-restore with MONGO_TOOLS_BIN if tools are installed but not on PATH.\n'
    );
  }

  const sourceClient = await connectMongoClient(sourceUri, 'SOURCE (remote)');
  const targetClient = await connectMongoClient(targetUri, 'TARGET (local)');

  if (LIST_SOURCE_DATABASES) {
    await tryListRemoteDatabases(sourceClient);
  }

  const sourceDb = getDb(sourceClient, sourceUri, sourceOverride);
  const targetDb = getDb(targetClient, targetUri, targetOverride);

  const sourceDbName = sourceDb.databaseName;
  const targetDbName = targetDb.databaseName;

  console.log('Using source database:', sourceDbName);
  console.log('Using target database:', targetDbName);
  if (DRY_RUN) console.log('DRY RUN — no writes\n');

  const collInfos = await sourceDb.listCollections().toArray();
  const names = collInfos.map((c) => c.name).filter(isUserCollection);

  console.log(`Collections to sync from "${sourceDbName}": ${names.length}\n`);

  if (names.length === 0) {
    console.warn(
      'No collections found. If you expected data, the source database name is probably wrong.\n' +
        '  → Set SOURCE_DATABASE to the remote DB name (e.g. infogram), or add /dbname to SOURCE_MONGODB_URI.\n' +
        '  → Run with LIST_SOURCE_DATABASES=1 to see names on the cluster (if allowed).'
    );
  }

  const summary = [];

  for (const name of names) {
    const info = collInfos.find((c) => c.name === name);
    if (info && info.type === 'view') {
      console.log(`— ${name}: skipped (view)`);
      continue;
    }

    const sourceColl = sourceDb.collection(name);
    const count = await sourceColl.countDocuments();
    console.log(`— ${name}: ${count} documents (source)`);

    if (DRY_RUN) {
      summary.push({ name, source: count, inserted: 0 });
      continue;
    }

    const targetColl = targetDb.collection(name);
    await targetColl.drop().catch(() => {});

    const { inserted, total } = await copyCollection(sourceColl, targetColl, name);
    await copyIndexes(sourceColl, targetColl, name);
    summary.push({ name, source: total, inserted });
  }

  await sourceClient.close();
  await targetClient.close();

  console.log('\n--- Summary (source count → inserted) ---');
  summary.forEach((r) => console.log(`  ${r.name}: ${r.source} → ${r.inserted}`));
  console.log(DRY_RUN ? '\nDry run finished.' : '\nDone. Local database updated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
