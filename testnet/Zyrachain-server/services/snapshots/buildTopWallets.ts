import mongoose from 'mongoose';
import { upsertSnapshot } from './snapshotStore';
import type { TopWalletRow, TopWalletsPayload } from './types';

const PI_ADDR = /^G[A-Z2-7]{55}$/;

export async function buildTopWallets(limit = 100): Promise<TopWalletsPayload> {
  const stateCol = mongoose.connection.collection('pct-wallet-state');

  const rows = await stateCol
    .find({ identifier: { $regex: PI_ADDR } })
    .sort({ lastBalance: -1 })
    .limit(limit)
    .project({ identifier: 1, lastBalance: 1, lastCheckedAt: 1 })
    .toArray();

  const coreCol = mongoose.connection.collection('core-team-addresses');
  const cexCol = mongoose.connection.collection('cex-addresses');
  const genCol = mongoose.connection.collection('generated-addresses');

  const nameById = new Map<string, string>();
  const [coreDocs, cexDocs, genDocs] = await Promise.all([
    coreCol.find({}).project({ identifier: 1, Name: 1, name: 1 }).toArray(),
    cexCol.find({}).project({ identifier: 1, Name: 1, name: 1 }).toArray(),
    genCol.find({}).project({ identifier: 1, Name: 1, name: 1 }).toArray(),
  ]);

  const coreSet = new Set<string>();
  const cexSet = new Set<string>();
  const genSet = new Set<string>();

  const ingest = (
    docs: Array<{ identifier?: unknown; Name?: unknown; name?: unknown }>,
    label: string,
    targetSet: Set<string>
  ) => {
    for (const d of docs) {
      const id = typeof d.identifier === 'string' ? d.identifier.trim() : '';
      if (!id) continue;
      targetSet.add(id);
      const name =
        (typeof d.Name === 'string' && d.Name) ||
        (typeof d.name === 'string' && d.name) ||
        label;
      nameById.set(id, name);
    }
  };

  ingest(coreDocs, 'Core Team', coreSet);
  ingest(cexDocs, 'CEX', cexSet);
  ingest(genDocs, 'Generated', genSet);

  const wallets: TopWalletRow[] = rows.map((r) => {
    const id = String(r.identifier);
    let category: TopWalletRow['category'] = 'Generated';
    if (cexSet.has(id)) category = 'CEX';
    else if (coreSet.has(id)) category = 'Core Team';
    else if (genSet.has(id)) category = 'Generated';

    return {
      identifier: id,
      name: nameById.get(id) || `Wallet ${id.slice(0, 8)}…`,
      category,
      balance: typeof r.lastBalance === 'number' ? r.lastBalance : null,
      lastCheckedAt:
        r.lastCheckedAt instanceof Date ? r.lastCheckedAt.toISOString() : r.lastCheckedAt
          ? String(r.lastCheckedAt)
          : null,
    };
  });

  const payload: TopWalletsPayload = {
    wallets,
    updatedAt: new Date().toISOString(),
  };
  await upsertSnapshot('top_wallets', payload);
  return payload;
}
