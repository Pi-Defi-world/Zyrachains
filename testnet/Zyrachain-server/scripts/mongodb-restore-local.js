/**
 * Restore a mongodump folder under .mongo-dump/ into local MongoDB (no Atlas needed).
 *
 * Use when you already ran mongodump (or have BSON files) and only need mongorestore.
 *
 * Env (from .env):
 *   MONGODB_URI          — required, e.g. mongodb://localhost:27017/Zyrachain
 *   MONGO_RESTORE_FROM   — optional; absolute or relative path to the dump ROOT
 *                          (folder that contains the database subfolder, e.g. .mongo-dump/run-123)
 *                          If omitted, uses the newest .mongo-dump/run-* directory.
 *   SOURCE_DUMP_DATABASE — optional; database folder name inside the dump (e.g. infogram).
 *                          If omitted and there is exactly one subfolder with .bson files, that name is used.
 *   TARGET_DATABASE      — optional; override target DB (default: name from MONGODB_URI path)
 *   MONGORESTORE_DROP=1  — drop collections before restore
 *   MONGO_TOOLS_BIN      — directory with mongorestore.exe (same as migrate script)
 *   DRY_RUN=1            — print command only
 *
 * Run (from Zyrachain-server/):
 *   pnpm run db:restore-local
 */

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { databaseNameFromUri, uriWithDatabase } = require('./mongo-uri-helpers');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const WITH_DROP = process.env.MONGORESTORE_DROP === '1' || process.env.MONGORESTORE_DROP === 'true';

function resolveMongorestorePath() {
  const win = process.platform === 'win32';
  const restoreName = win ? 'mongorestore.exe' : 'mongorestore';

  const tryFile = (dir) => {
    if (!dir || typeof dir !== 'string') return null;
    const d = path.resolve(dir.trim());
    const mr = path.join(d, restoreName);
    return fs.existsSync(mr) ? mr : null;
  };

  let p = tryFile(process.env.MONGO_TOOLS_BIN);
  if (p) return p;

  if (win) {
    const pf = [process.env['ProgramFiles'], process.env['ProgramFiles(x86)']].filter(Boolean);
    for (const base of pf) {
      const toolsRoot = path.join(base, 'MongoDB', 'Tools');
      if (!fs.existsSync(toolsRoot)) continue;
      let versions = [];
      try {
        versions = fs
          .readdirSync(toolsRoot, { withFileTypes: true })
          .filter((x) => x.isDirectory())
          .map((x) => x.name);
      } catch {
        continue;
      }
      versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
      for (const v of versions) {
        p = tryFile(path.join(toolsRoot, v, 'bin'));
        if (p) return p;
      }
    }
    const where = spawnSync('where.exe', ['mongorestore'], { encoding: 'utf8', windowsHide: true });
    if (where.status === 0 && where.stdout) {
      const first = where.stdout
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => l.toLowerCase().endsWith('mongorestore.exe'));
      if (first && fs.existsSync(first)) return first;
    }
  } else {
    const which = spawnSync('which', ['mongorestore'], { encoding: 'utf8' });
    if (which.status === 0 && which.stdout) {
      const line = which.stdout.trim().split('\n')[0];
      if (line && fs.existsSync(line)) return line;
    }
  }
  return null;
}

function findLatestRunDump() {
  const root = path.join(process.cwd(), '.mongo-dump');
  if (!fs.existsSync(root)) return null;
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const runs = entries
    .filter((d) => d.isDirectory() && d.name.startsWith('run-'))
    .map((d) => ({
      name: d.name,
      full: path.join(root, d.name),
      mtime: fs.statSync(path.join(root, d.name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  return runs[0]?.full ?? null;
}

function detectDumpDatabaseFolder(dumpRoot) {
  const explicit = (process.env.SOURCE_DUMP_DATABASE || '').trim();
  if (explicit) return explicit;

  const subs = fs
    .readdirSync(dumpRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const withBson = subs.filter((name) => {
    const dir = path.join(dumpRoot, name);
    try {
      return fs.readdirSync(dir).some((f) => f.endsWith('.bson'));
    } catch {
      return false;
    }
  });

  if (withBson.length === 1) return withBson[0];
  if (withBson.length === 0) {
    throw new Error(`No database subfolder with .bson files under: ${dumpRoot}`);
  }
  throw new Error(
    `Multiple DB folders in dump: ${withBson.join(', ')}. Set SOURCE_DUMP_DATABASE=one_of_them`
  );
}

function main() {
  const targetUri = process.env.MONGODB_URI || process.env.TARGET_MONGODB_URI;
  if (!targetUri) {
    console.error('Set MONGODB_URI in .env (e.g. mongodb://localhost:27017/Zyrachain)');
    process.exit(1);
  }

  const restoreExe = resolveMongorestorePath();
  if (!restoreExe) {
    console.error(`
mongorestore not found. Install MongoDB Database Tools and set MONGO_TOOLS_BIN to the "bin" folder,
or add Tools to PATH. https://www.mongodb.com/try/download/database-tools
`);
    process.exit(1);
  }

  let dumpRoot = (process.env.MONGO_RESTORE_FROM || '').trim();
  if (dumpRoot) {
    dumpRoot = path.resolve(process.cwd(), dumpRoot);
  } else {
    dumpRoot = findLatestRunDump();
  }

  if (!dumpRoot || !fs.existsSync(dumpRoot)) {
    console.error(`
No dump folder found. Either:
  - Run: pnpm run db:migrate-dump-restore   (dump + restore), or
  - Set MONGO_RESTORE_FROM=.mongo-dump/run-<timestamp>   (path to folder that CONTAINS "infogram" etc.)
`);
    process.exit(1);
  }

  const sourceDb = detectDumpDatabaseFolder(dumpRoot);
  const targetDb =
    (process.env.TARGET_DATABASE || process.env.TARGET_DB_NAME || '').trim() ||
    databaseNameFromUri(targetUri);

  const targetDbResolved = targetDb || sourceDb;
  if (!targetDbResolved) {
    console.error(
      'Could not determine target database. Set MONGODB_URI with /dbname (e.g. .../Zyrachain) or TARGET_DATABASE=Zyrachain'
    );
    process.exit(1);
  }

  if (sourceDb !== targetDbResolved) {
    console.log(`Restoring dump folder "${sourceDb}" → database "${targetDbResolved}" (mongorestore: URI db + path to BSON folder).`);
  }

  /**
   * Do NOT use --nsFrom/--nsTo with Tools 100+ when --uri already has /dbname — it skips subdirs.
   * Pass the database dump directory (…/infogram) and set target only via URI.
   */
  const dbBsonDir = path.join(dumpRoot, sourceDb);
  const restoreUri = uriWithDatabase(targetUri, targetDbResolved);

  const args = ['--uri', restoreUri];
  if (WITH_DROP) args.push('--drop');
  args.push(dbBsonDir);

  console.log('mongorestore:', restoreExe);
  console.log('BSON directory:', dbBsonDir);
  console.log('Target URI:', restoreUri.replace(/:[^:@/]+@/, ':****@'));
  console.log('Args:', args.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' '));

  if (DRY_RUN) {
    console.log('\nDRY_RUN — not executing.');
    return;
  }

  const r = spawnSync(restoreExe, args, { stdio: 'inherit', env: process.env });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
  console.log('\nRestore finished. Open Compass with your MONGODB_URI to verify.');
}

main();
