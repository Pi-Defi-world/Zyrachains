import { upsertSnapshot } from './snapshotStore';
import type { LatestOpsPayload } from './types';
import { getHorizonMainnet } from './horizonMainnet';

export async function buildLatestOps(limit = 20): Promise<LatestOpsPayload> {
  const h = getHorizonMainnet();
  const { data } = await h.get('/operations', {
    params: { order: 'desc', limit },
  });
  const records = (data as { _embedded?: { records: unknown[] } })._embedded?.records ?? [];
  const payload: LatestOpsPayload = {
    records,
    horizonLinks: (data as { _links?: unknown })._links as Record<string, unknown>,
    updatedAt: new Date().toISOString(),
  };
  await upsertSnapshot('latest_ops', payload);
  return payload;
}
