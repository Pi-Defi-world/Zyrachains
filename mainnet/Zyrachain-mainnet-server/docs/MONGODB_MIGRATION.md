# MongoDB migration: Atlas → local

**MongoDB Compass** is only a GUI to browse data. Migration is always: **remote cluster → files or stream → local `mongod`**.

## Recommended: `mongodump` + `mongorestore` (Database Tools)

Best for a **faithful copy** (BSON, indexes, large data). This is what MongoDB documents for backups and moves.

### 1. Install

- [MongoDB Community Server](https://www.mongodb.com/try/download/community) (local `mongod` on default port 27017, or use your own target).
- [MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools) — **separate** download.

**Windows — tools not on PATH:** the migrate script looks under `C:\Program Files\MongoDB\Tools\<version>\bin` automatically. You can also set in `.env`:

```env
MONGO_TOOLS_BIN=C:\Program Files\MongoDB\Tools\100\bin
```

(use the folder that actually contains `mongodump.exe`; version may be `100`, `99`, etc.)

### 2. Configure `.env` (Zyrachain-server)

```env
SOURCE_MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/infogram
MONGODB_URI=mongodb://localhost:27017/Zyrachain
```

- If Atlas and local **database names differ** (`infogram` vs `Zyrachain`), set both or rely on URI paths; the script uses `--nsFrom` / `--nsTo` when needed.
- If `querySrv` / SRV DNS fails on your network, use Atlas’s **standard** `mongodb://` connection string (not SRV) for `SOURCE_MONGODB_URI`.

### 3. Run (from `Zyrachain-server/`)

**Dump + restore in one step:**

```bash
pnpm run db:migrate-dump-restore
```

**You already have a dump under `.mongo-dump/` (e.g. only `mongorestore` failed or you copied files):**

1. Ensure `MONGODB_URI` points at local, e.g. `mongodb://localhost:27017/Zyrachain`.
2. If the dump database folder is `infogram` but local DB should be `Zyrachain`, the script maps them automatically via `--nsFrom` / `--nsTo`.
3. Run:

```bash
pnpm run db:restore-local
```

Optional: `MONGO_RESTORE_FROM=.mongo-dump/run-1773962741847` if you don’t want the newest `run-*` folder.  
`MONGORESTORE_DROP=1` replaces existing collections on the target.

Optional:

| Env | Effect |
|-----|--------|
| `DRY_RUN=1` | Print `mongodump` / `mongorestore` commands only |
| `SOURCE_DATABASE=infogram` | Dump only that DB (if omitted, uses name from URI path or dumps all DBs in the cluster) |
| `TARGET_DATABASE=Zyrachain` | Used with `nsFrom`/`nsTo` when renaming |
| `MONGORESTORE_DROP=1` | `--drop` collections before restore (clean overwrite) |
| `MONGO_DUMP_DIR=./my-backup` | Custom dump directory (default: `.mongo-dump/run-<timestamp>`) |

### 4. Compass

Connect to: `mongodb://localhost:27017` (or your `MONGODB_URI`).

---

## Alternative: Node sync script

```bash
pnpm run db:sync-from-remote
```

- No Database Tools install; uses the Node `mongodb` driver.
- Copies **per collection** with `insertMany`; recreates most indexes.
- Handy for quick syncs; for **production-grade** or very large DBs, prefer **dump/restore** above.

---

## Manual commands (same as the script)

Dump:

```bash
mongodump --uri="mongodb+srv://USER:PASS@HOST/infogram" --out=./dump
# Or one database only:
mongodump --uri="..." --db=infogram --out=./dump
```

Restore to local (same DB name):

```bash
mongorestore --uri="mongodb://localhost:27017" ./dump
```

Restore **renaming** `infogram` → `Zyrachain` (recommended with **Database Tools 100+** — avoids “skipping subdirectory”):

```bash
mongorestore --uri="mongodb://localhost:27017/Zyrachain" ./dump/infogram
```

(`./dump/infogram` is the folder that contains `*.bson` files; the target DB is only the name in the URI.)

Older pattern (can fail on some Tool versions with URI + `nsFrom`/`nsTo`):

```bash
mongorestore --uri="mongodb://localhost:27017" --nsFrom="infogram.*" --nsTo="Zyrachain.*" ./dump
```

---

## Troubleshooting

| Issue | What to do |
|--------|------------|
| `mongodump` not found | Install Database Tools and add `bin` to PATH; new terminal. |
| `querySrv ECONNREFUSED` | Use standard `mongodb://` URI from Atlas, or fix DNS/VPN. |
| “skipping subdirectory … 0 documents restored” | Use `pnpm run db:restore-local` (fixed) or `mongorestore --uri=.../TARGETDB path/to/dump/SOURCEDB` (folder with `.bson` files). |
| Atlas auth | Network Access: allow your IP; user/password correct in URI. |
| Local connection refused | Start `mongod` or Windows service “MongoDB”. |
| Port in use | Another process on 27017 — stop it or change port in `MONGODB_URI`. |
