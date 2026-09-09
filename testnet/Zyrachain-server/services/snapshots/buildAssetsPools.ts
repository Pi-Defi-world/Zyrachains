import { upsertSnapshot } from './snapshotStore';
import type { AssetsPoolsPayload, HorizonEmbedded } from './types';
import { getHorizonMainnet } from './horizonMainnet';

export async function buildAssetsPools(
  assetsLimit = 100,
  poolsLimit = 20
): Promise<AssetsPoolsPayload> {
  const h = getHorizonMainnet();
  const [assetsRes, poolsRes] = await Promise.all([
    h.get<HorizonEmbedded<unknown>>('/assets', { params: { limit: assetsLimit, order: 'desc' } }),
    h.get<HorizonEmbedded<unknown>>('/liquidity_pools', { params: { limit: poolsLimit, order: 'desc' } }),
  ]);

  const payload: AssetsPoolsPayload = {
    assets: assetsRes.data,
    pools: poolsRes.data,
    updatedAt: new Date().toISOString(),
  };
  await upsertSnapshot('assets_pools', payload);
  return payload;
}
