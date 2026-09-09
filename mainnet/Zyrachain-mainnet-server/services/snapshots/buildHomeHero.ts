import { upsertSnapshot } from './snapshotStore';
import type { HomeHeroPayload } from './types';
import { getHorizonMainnet } from './horizonMainnet';
import { getMexc24hrTicker } from '../../oracle/setupAggregator';

/** Pi supply constants (Pi Network: 100B max supply). */
const DEFAULT_SUPPLY = {
  total_circulating_supply: 10_600_000_000,
  total_locked: 6_170_000_000,
  total_supply: 100_000_000_000,
};

export async function buildHomeHero(): Promise<HomeHeroPayload> {
  const h = getHorizonMainnet();

  // Fetch MEXC 24hr ticker — gives price, high, low, open, change% in one call
  const ticker = await getMexc24hrTicker().catch(() => null);

  const priceUsd = ticker?.priceUsd || 0;

  let latest_block = 0;
  let horizon_ingest_latest_ledger: number | undefined;
  let tps = 0;

  try {
    const root = await h.get<{ ingest_latest_ledger?: number; core_latest_ledger?: number }>('/');
    horizon_ingest_latest_ledger =
      typeof root.data.ingest_latest_ledger === 'number'
        ? root.data.ingest_latest_ledger
        : undefined;
    latest_block =
      typeof root.data.core_latest_ledger === 'number'
        ? root.data.core_latest_ledger
        : horizon_ingest_latest_ledger ?? 0;
  } catch {
    try {
      const ledgers = await h.get('/ledgers', { params: { order: 'desc', limit: 1 } });
      latest_block = (ledgers.data as any)?._embedded?.records?.[0]?.sequence ?? 0;
    } catch { latest_block = 0; }
  }

  try {
    const ledgers100 = await h.get('/ledgers', { params: { order: 'desc', limit: 100 } });
    const rows = (ledgers100.data as any)?._embedded?.records ?? [];
    let sum = 0;
    for (const r of rows) {
      sum += typeof r.successful_transaction_count === 'number' ? r.successful_transaction_count : 0;
    }
    tps = rows.length > 0 ? sum / (rows.length * 5) : 0;
  } catch { tps = 0; }

  const total_circulating_supply = DEFAULT_SUPPLY.total_circulating_supply;
  const total_supply = DEFAULT_SUPPLY.total_supply;
  const total_locked = DEFAULT_SUPPLY.total_locked;

  const market_cap_usd = priceUsd * total_circulating_supply;
  const fdv_usd = priceUsd * total_supply;

  const payload: HomeHeroPayload = {
    priceUsd,
    confidenceScore: 0.95, // MEXC is reliable
    high24hUsd: ticker?.high24hUsd ?? priceUsd,
    low24hUsd: ticker?.low24hUsd ?? priceUsd,
    open24hUsd: ticker?.open24hUsd ?? priceUsd,
    priceChange24h: ticker?.priceChange24h ?? 0,
    total_circulating_supply,
    total_locked,
    total_supply,
    market_cap_usd,
    fdv_usd,
    latest_block,
    tps,
    horizon_ingest_latest_ledger,
    source_prices: undefined,
    updatedAt: new Date().toISOString(),
  };

  await upsertSnapshot('home_hero', payload);
  return payload;
}
