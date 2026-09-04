export const dynamic = 'force-dynamic';

import { fetchSnapshot } from '@/lib/server-fetch';
import { HomePage } from '@/components/home/HomePage';

type HeroData = {
  priceUsd: number;
  market_cap_usd: number;
  fdv_usd: number;
  total_circulating_supply: number;
  total_supply: number;
  total_locked: number;
  latest_block: number;
  tps: number;
  high24hUsd?: number;
  low24hUsd?: number;
  priceChange24h?: number;
  marketCapChange24h?: number;
  confidenceScore?: number;
  updatedAt?: string;
};

type PulseData = {
  netChange24hCoreTeam: number;
  netChange24hCex: number;
  largestMoves24h: Array<{
    wallet: string;
    change: number;
    detectedAt: string;
  }>;
};

type WalletItem = {
  identifier: string;
  name: string;
  category: 'CEX' | 'Core Team' | 'Generated';
  balance: number | null;
};

type TopWalletsData = {
  wallets: WalletItem[];
};

type AssetRecord = Record<string, unknown>;
type PoolRecord = Record<string, unknown>;

type TradeRecord = {
  base_amount?: string;
  counter_amount?: string;
  base_asset_type?: string;
  counter_asset_type?: string;
  base_asset_code?: string;
  counter_asset_code?: string;
};

const TESTNET_HORIZON = process.env.NEXT_PUBLIC_TESTNET_HORIZON_URL || 'https://testnet.suban.org';

async function fetchTestnetAssetsPools(): Promise<{ assets: AssetRecord[]; pools: PoolRecord[] }> {
  try {
    // Fetch all pages of assets (up to 5 pages / 500 assets)
    const allAssets: AssetRecord[] = [];
    let assetUrl: string | null = `${TESTNET_HORIZON}/assets?limit=200&order=desc`;
    let pages = 0;
    while (assetUrl && pages < 5) {
      const res: Response = await fetch(assetUrl);
      const json: Record<string, unknown> = await res.json();
      const records = (json._embedded as Record<string, unknown> | undefined)?.records as AssetRecord[] ?? [];
      allAssets.push(...records);
      assetUrl = ((json._links as Record<string, unknown> | undefined)?.next as Record<string, unknown> | undefined)?.href as string ?? null;
      pages++;
    }

    const [poolsRes] = await Promise.all([
      fetch(`${TESTNET_HORIZON}/liquidity_pools?limit=200&order=desc`),
    ]);
    const poolsJson = await poolsRes.json();
    return {
      assets: allAssets,
      pools: (poolsJson._embedded?.records ?? []) as PoolRecord[],
    };
  } catch {
    return { assets: [], pools: [] };
  }
}

function computeVolume(records: TradeRecord[], priceUsd: number): { volumeUsd: number; pairs: number } {
  let piVolume = 0;
  const pairSet = new Set<string>();
  for (const t of records) {
    const baseNative = t.base_asset_type === 'native';
    const counterNative = t.counter_asset_type === 'native';
    if (baseNative) piVolume += parseFloat(t.base_amount || '0') || 0;
    else if (counterNative) piVolume += parseFloat(t.counter_amount || '0') || 0;
    const baseLabel = baseNative ? 'Pi' : t.base_asset_code || t.base_asset_type || '?';
    const counterLabel = counterNative ? 'Pi' : t.counter_asset_code || t.counter_asset_type || '?';
    pairSet.add(`${baseLabel}/${counterLabel}`);
  }
  return { volumeUsd: piVolume * (priceUsd || 0), pairs: pairSet.size };
}

export default async function Page() {
  const [heroRes, pulseRes, walletsRes, testnetData, tradesRes] = await Promise.all([
    fetchSnapshot<HeroData>('hero', 10),
    fetchSnapshot<PulseData>('pulse', 120),
    fetchSnapshot<TopWalletsData>('top-wallets', 300),
    fetchTestnetAssetsPools(),
    fetchSnapshot<{ records: TradeRecord[] }>('latest-trades', 20),
  ]);

  let tickerVolumeUsd: number | null = null;
  let tickerPairs: number | null = null;
  if (tradesRes.success && tradesRes.data?.records && heroRes.success && heroRes.data) {
    const { volumeUsd, pairs } = computeVolume(tradesRes.data.records, heroRes.data.priceUsd);
    tickerVolumeUsd = volumeUsd;
    tickerPairs = pairs;
  }

  return (
    <HomePage
      hero={heroRes}
      pulse={pulseRes}
      wallets={walletsRes}
      assets={testnetData.assets}
      pools={testnetData.pools}
      tickerVolumeUsd={tickerVolumeUsd}
      tickerPairs={tickerPairs}
    />
  );
}
