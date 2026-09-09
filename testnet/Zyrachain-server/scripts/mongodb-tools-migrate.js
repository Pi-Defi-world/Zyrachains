/**
 * Recommended migration: MongoDB Database Tools (mongodump + mongorestore).
 * Produces a BSON-accurate copy; handles indexes; official tooling.
 *
 * Prereqs (install once):
 *   - MongoDB Community Server (local mongod) OR any reachable target
 *   - MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools
 *
 * Finding tools on Windows:
 *   - Prefer adding the Tools `bin` folder to your PATH, OR
 *   - Set MONGO_TOOLS_BIN to that folder (e.g. C:\Program Files\MongoDB\Tools\100\bin)
 *   - This script also searches "Program Files\MongoDB\Tools\<version>\bin" automatically.
 *
 * Env (same as sync script, from .env):
 *   SOURCE_MONGODB_URI   — Atlas / remote URI
 *   MONGODB_URI          — local target, e.g. mongodb://localhost:27017/Zyrachain
 *   SOURCE_DATABASE      — optional; dump only this DB if not in URI path
 *   TARGET_DATABASE      — optional; restore into this DB name (URI + BSON folder path; no broken nsFrom/nsTo)
 *
 * If mongodump fails with querySrv / SRV errors, use Atlas "standard" mongodb:// URI (not SRV).
 *
 * Optional:
 *   DRY_RUN=1            — print commands only
 *   MONGORESTORE_DROP=1  — pass --drop
 *   MONGO_DUMP_DIR       — override output folder
 *   MONGO_TOOLS_BIN      — directory containing mongodump.exe / mongorestore.exe
 *
 * Run (from Zyrachain-server/):
 *   pnpm run db:migrate-dump-restore
 */

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { databaseNameFromUri, uriWithDatabase } = require('./mongo-uri-helpers');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const WITH_DROP = process.env.MONGORESTORE_DROP === '1' || process.env.MONGORESTORE_DROP === 'true';

/** @returns {{ dir: string, mongodump: string, mongorestore: string } | null} */
function resolveMongoTools() {
  const win = process.platform === 'win32';
  const dumpName = win ? 'mongodump.exe' : 'mongodump';
  const restoreName = win ? 'mongorestore.exe' : 'mongorestore';

  const tryDir = (dir) => {
    if (!dir || typeof dir !== 'string') return null;
    const d = path.resolve(dir.trim());
    const md = path.join(d, dumpName);
    const mr = path.join(d, restoreName);
    if (fs.existsSync(md) && fs.existsSync(mr)) {
      return { dir: d, mongodump: md, mongorestore: mr };
    }
    return null;
  };

  const fromEnv = tryDir(process.env.MONGO_TOOLS_BIN);
  if (fromEnv) return fromEnv;

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
        const hit = tryDir(path.join(toolsRoot, v, 'bin'));
        if (hit) return hit;
      }
    }

    const whereDump = spawnSync('where.exe', ['mongodump'], {
      encoding: 'utf8',
      windowsHide: true,
    });
    if (whereDump.status === 0 && whereDump.stdout) {
      const first = whereDump.stdout
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => l.toLowerCase().endsWith('mongodump.exe'));
      if (first) {
        const dir = path.dirname(first);
        const hit = tryDir(dir);
        if (hit) return hit;
      }
    }
  } else {
    const which = spawnSync('which', ['mongodump'], { encoding: 'utf8' });
    if (which.status === 0 && which.stdout) {
      const dir = path.dirname(which.stdout.trim().split('\n')[0]);
      const hit = tryDir(dir);
      if (hit) return hit;
    }
  }

  const cwdHit = tryDir(process.cwd());
  if (cwdHit) return cwdHit;

  return null;
}

function run(label, exePath, args) {
  const quoted = args.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a));
  console.log(`\n→ ${label}:\n   "${exePath}" ${quoted.join(' ')}\n`);
  if (DRY_RUN) return 0;
  const r = spawnSync(exePath, args, { stdio: 'inherit', env: process.env });
  if (r.status !== 0) {
    console.error(`\nCommand failed with exit code ${r.status}`);
    process.exit(r.status ?? 1);
  }
  return r.status;
}

function printToolsHelp() {
  console.error(`
MongoDB Database Tools not found (mongodump / mongorestore).

1) Install: https://www.mongodb.com/try/download/database-tools
   (Choose "zip" for Windows and extract, or the MSI if offered.)

2) Point this project at the bin folder (no need for global PATH), e.g. in .env:
     MONGO_TOOLS_BIN=C:\\Program Files\\MongoDB\\Tools\\100\\bin
   (Use your actual version folder: 100, 99, etc.)

3) Or add that same "bin" folder to your user PATH and open a NEW terminal.

4) If Atlas uses mongodb+srv:// and dump fails with querySrv errors, set SOURCE_MONGODB_URI
   to the "standard connection string" from Atlas (mongodb://host:27017,...).

Fallback without tools: pnpm run db:sync-from-remote  (needs a working URI — use standard mongodb:// if SRV/DNS fails)
`);
}

function main() {
  const sourceUri = process.env.SOURCE_MONGODB_URI;
  const targetUri = process.env.MONGODB_URI || process.env.TARGET_MONGODB_URI;

  if (!sourceUri) {
    console.error('Missing SOURCE_MONGODB_URI in .env');
    process.exit(1);
  }
  if (!targetUri) {
    console.error('Missing MONGODB_URI (local target) in .env');
    process.exit(1);
  }

  const tools = resolveMongoTools();
  if (!tools) {
    printToolsHelp();
    process.exit(1);
  }

  console.log('Using MongoDB Database Tools from:', tools.dir);

  if (/^mongodb\+srv:/i.test(sourceUri)) {
    console.log(
      '\nNote: SOURCE uses mongodb+srv:// — if dump fails with querySrv/DNS errors, switch SOURCE_MONGODB_URI to Atlas’s standard mongodb:// connection string.\n'
    );
  }

  const sourceDb =
    (process.env.SOURCE_DATABASE || process.env.SOURCE_DB_NAME || '').trim() ||
    databaseNameFromUri(sourceUri);
  const targetDb =
    (process.env.TARGET_DATABASE || process.env.TARGET_DB_NAME || '').trim() ||
    databaseNameFromUri(targetUri);

  const defaultOut = path.join(process.cwd(), '.mongo-dump', `run-${Date.now()}`);
  const outDir = (process.env.MONGO_DUMP_DIR || defaultOut).trim();

  console.log('Configuration:');
  console.log('  SOURCE_DATABASE (dump):', sourceDb || '(all databases in cluster — no --db filter)');
  console.log('  TARGET_DATABASE (URI path):', targetDb || '(from MONGODB_URI only)');
  console.log('  Dump output:', outDir);
  console.log('  DRY_RUN:', DRY_RUN);
  console.log('  MONGORESTORE_DROP:', WITH_DROP);

  if (!DRY_RUN) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const dumpArgs = ['--uri', sourceUri, '--out', outDir];
  if (sourceDb) {
    dumpArgs.push('--db', sourceDb);
  }

  run('mongodump (remote → BSON files)', tools.mongodump, dumpArgs);

  /**
   * mongorestore 100+ skips DB subdirs when --uri has /dbname and --nsFrom/--nsTo are used.
   * Restore from the BSON directory (outDir/<sourceDb> or whole outDir) and set target DB in URI only.
   */
  let restoreArgs;
  if (sourceDb) {
    const targetDbResolved = (
      targetDb ||
      databaseNameFromUri(targetUri) ||
      sourceDb
    ).trim();
    if (!targetDbResolved) {
      console.error('Set MONGODB_URI with /dbname or TARGET_DATABASE for restore.');
      process.exit(1);
    }
    if (sourceDb !== targetDbResolved) {
      console.log(`\nRestore: BSON folder "${sourceDb}" → database "${targetDbResolved}"`);
    }
    const restoreUri = uriWithDatabase(targetUri, targetDbResolved);
    restoreArgs = ['--uri', restoreUri];
    if (WITH_DROP) restoreArgs.push('--drop');
    restoreArgs.push(path.join(outDir, sourceDb));
  } else {
    restoreArgs = ['--uri', targetUri];
    if (WITH_DROP) restoreArgs.push('--drop');
    restoreArgs.push(outDir);
  }

  run('mongorestore (BSON files → local)', tools.mongorestore, restoreArgs);

  console.log(`
Done.
  Dump folder: ${outDir}
  You can delete it to save disk space, or keep it as a backup.

Tip: Connect MongoDB Compass to your MONGODB_URI to browse the data.
`);
}

main();
