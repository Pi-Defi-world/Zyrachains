import { upsertSnapshot } from './snapshotStore';
import { getHorizonMainnet } from './horizonMainnet';

export interface LatestTradesPayload {
  records: unknown[];
  horizonLinks?: Record<string, unknown>;
  updatedAt: string;
}

export async function buildLatestTrades(limit = 40): Promise<LatestTradesPayload> {
  const h = getHorizonMainnet();
  const { data } = await h.get('/trades', {
    params: { order: 'desc', limit },
  });
  const records = (data as { _embedded?: { records: unknown[] } })._embedded?.records ?? [];
  const payload: LatestTradesPayload = {
    records,
    horizonLinks: (data as { _links?: unknown })._links as Record<string, unknown>,
    updatedAt: new Date().toISOString(),
  };
  await upsertSnapshot('latest_trades', payload);
  return payload;
}
