import { NextResponse } from 'next/server';

const TESTNET_HORIZON = process.env.NEXT_PUBLIC_TESTNET_HORIZON_URL || 'https://testnet.suban.org';
const PI_TESTNET_FALLBACK = 'https://api.testnet.minepi.com';

export const dynamic = 'force-dynamic';
export const revalidate = 120;

interface HorizonRecord {
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  amount?: string;
  num_accounts?: number;
  liquidity_pools_amount?: string;
  id?: string;
  fee_bp?: number;
  total_trustlines?: string;
  total_shares?: string;
  reserves?: Array<{ asset?: string; amount?: string }>;
}

async function fetchWithFallback<T>(primaryUrl: string, fallbackUrl: string): Promise<{ data: T; source: string } | null> {
  try {
    const res = await fetch(primaryUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as T;
    return { data, source: 'suban' };
  } catch {
    try {
      const res = await fetch(fallbackUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as T;
      return { data, source: 'pi' };
    } catch {
      return null;
    }
  }
}

export async function GET() {
  try {
    const allAssets: HorizonRecord[] = [];
    let assetUrl: string | null = `${TESTNET_HORIZON}/assets?limit=200&order=desc`;
    let pages = 0;
    let source = 'suban';

    while (assetUrl && pages < 5) {
      const result = await fetchWithFallback<{ _embedded?: { records?: HorizonRecord[] }; _links?: { next?: { href?: string } } }>(
        assetUrl,
        assetUrl.replace(TESTNET_HORIZON, PI_TESTNET_FALLBACK)
      );
      if (!result) break;
      source = result.source;
      allAssets.push(...(result.data._embedded?.records ?? []));
      assetUrl = result.data._links?.next?.href ?? null;
      pages++;
    }

    const poolsResult = await fetchWithFallback<{ _embedded?: { records?: HorizonRecord[] } }>(
      `${TESTNET_HORIZON}/liquidity_pools?limit=200&order=desc`,
      `${PI_TESTNET_FALLBACK}/liquidity_pools?limit=200&order=desc`
    );

    return NextResponse.json({
      success: true,
      data: {
        assets: allAssets,
        pools: poolsResult?.data._embedded?.records ?? [],
        updatedAt: new Date().toISOString(),
        source,
      },
    });
  } catch (error) {
    console.error('Testnet assets-pools proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch testnet assets/pools' },
      { status: 502 },
    );
  }
}
