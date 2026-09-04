import { NextResponse } from 'next/server';

const TESTNET_HORIZON = process.env.NEXT_PUBLIC_TESTNET_HORIZON_URL || 'https://testnet.suban.org';

export const dynamic = 'force-dynamic';
export const revalidate = 120; // 2 min cache

interface HorizonRecord {
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  amount?: string;
  num_accounts?: number;
  liquidity_pools_amount?: string;
  // pool fields
  id?: string;
  fee_bp?: number;
  total_trustlines?: string;
  total_shares?: string;
  reserves?: Array<{ asset?: string; amount?: string }>;
}

export async function GET() {
  try {
    // Fetch all asset pages (up to 5 pages / 1000 assets)
    const allAssets: HorizonRecord[] = [];
    let assetUrl: string | null = `${TESTNET_HORIZON}/assets?limit=200&order=desc`;
    let pages = 0;
    while (assetUrl && pages < 5) {
      const res: Response = await fetch(assetUrl);
      const json: Record<string, unknown> = await res.json();
      const records = (json._embedded as Record<string, unknown> | undefined)?.records as HorizonRecord[] ?? [];
      allAssets.push(...records);
      assetUrl = ((json._links as Record<string, unknown> | undefined)?.next as Record<string, unknown> | undefined)?.href as string ?? null;
      pages++;
    }

    const poolsRes = await fetch(`${TESTNET_HORIZON}/liquidity_pools?limit=200&order=desc`);
    const poolsJson: Record<string, unknown> = await poolsRes.json();
    const pools = ((poolsJson._embedded as Record<string, unknown> | undefined)?.records ?? []) as HorizonRecord[];

    return NextResponse.json({
      success: true,
      data: {
        assets: allAssets,
        pools,
        updatedAt: new Date().toISOString(),
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
