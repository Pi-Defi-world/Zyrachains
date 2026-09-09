import mongoose from 'mongoose';
import { upsertSnapshot } from './snapshotStore';
import type { CexFlowsPayload, CexFlowRow } from './types';

const DAY_MS = 86_400_000;

export async function buildCexFlows(): Promise<CexFlowsPayload> {
  const since = new Date(Date.now() - DAY_MS);
  const cexCol = mongoose.connection.collection('cex-addresses');
  const eventsCol = mongoose.connection.collection('pct-balance-events');

  const cexDocs = await cexCol.find({}).toArray();
  const cexRows: Array<{ identifier: string; name: string }> = [];
  const namesById = new Map<string, string>();

  for (const doc of cexDocs) {
    const raw = doc as Record<string, unknown>;
    const identifier =
      typeof raw.identifier === 'string'
        ? raw.identifier.trim()
        : typeof raw.Identifier === 'string'
          ? String(raw.Identifier).trim()
          : '';
    if (!identifier) continue;

    const name =
      (typeof raw.Name === 'string' && raw.Name) ||
      (typeof raw.name === 'string' && raw.name) ||
      'CEX';
    cexRows.push({ identifier, name });
    namesById.set(identifier, name);
  }

  const ids = cexRows.map((r) => r.identifier);
  const aggRows = ids.length
    ? await eventsCol
        .aggregate<{
          _id: string;
          net24h: number;
          in24h: number;
          out24h: number;
        }>([
          { $match: { detectedAt: { $gte: since }, wallet: { $in: ids } } },
          {
            $group: {
              _id: '$wallet',
              net24h: { $sum: '$change' },
              in24h: { $sum: { $cond: [{ $gt: ['$change', 0] }, '$change', 0] } },
              out24h: {
                $sum: {
                  $cond: [{ $lt: ['$change', 0] }, { $multiply: ['$change', -1] }, 0],
                },
              },
            },
          },
        ])
        .toArray()
    : [];

  const aggById = new Map(
    aggRows.map((r) => [
      String(r._id),
      {
        net24h: typeof r.net24h === 'number' ? r.net24h : 0,
        in24h: typeof r.in24h === 'number' ? r.in24h : 0,
        out24h: typeof r.out24h === 'number' ? r.out24h : 0,
      },
    ])
  );

  const flows: CexFlowRow[] = cexRows.map(({ identifier }) => {
    const row = aggById.get(identifier);
    return {
      identifier,
      name: namesById.get(identifier) || 'CEX',
      net24h: row?.net24h ?? 0,
      in24h: row?.in24h ?? 0,
      out24h: row?.out24h ?? 0,
    };
  });

  flows.sort((a, b) => Math.abs(b.net24h) - Math.abs(a.net24h));

  const payload: CexFlowsPayload = {
    flows,
    updatedAt: new Date().toISOString(),
  };
  await upsertSnapshot('cex_flows', payload);
  return payload;
}
