import { upsertSnapshot } from './snapshotStore';
import type { LatestTransactionsPayload } from './types';
import { getHorizonMainnet } from './horizonMainnet';

export async function buildLatestTransactions(limit = 20): Promise<LatestTransactionsPayload> {
  const h = getHorizonMainnet();
  const { data } = await h.get('/transactions', {
    params: { order: 'desc', limit },
  });
  const records = (data as { _embedded?: { records: unknown[] } })._embedded?.records ?? [];
  const payload: LatestTransactionsPayload = {
    records,
    horizonLinks: (data as { _links?: unknown })._links as Record<string, unknown>,
    updatedAt: new Date().toISOString(),
  };
  await upsertSnapshot('latest_transactions', payload);
  return payload;
}
