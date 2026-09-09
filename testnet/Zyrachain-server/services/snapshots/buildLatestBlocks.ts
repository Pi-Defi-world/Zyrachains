import { upsertSnapshot } from './snapshotStore';
import type { LatestBlocksPayload, LedgerSummary } from './types';
import { getHorizonMainnet } from './horizonMainnet';

export async function buildLatestBlocks(limit = 20): Promise<LatestBlocksPayload> {
  const h = getHorizonMainnet();
  const { data } = await h.get<{
    _embedded?: { records: LedgerSummary[] };
    _links?: Record<string, { href?: string }>;
  }>('/ledgers', {
    params: { order: 'desc', limit },
  });

  const records = data._embedded?.records ?? [];
  const payload: LatestBlocksPayload = {
    records,
    nextCursor: data._links?.next?.href ?? null,
    prevCursor: data._links?.prev?.href ?? null,
    horizonLinks: data._links as Record<string, unknown>,
    updatedAt: new Date().toISOString(),
  };
  await upsertSnapshot('latest_blocks', payload);
  return payload;
}
