'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpDown, Coins, Droplets, ExternalLink, RefreshCw } from 'lucide-react';
import { fmtCompact, fmtInt, shortHash } from '@/lib/format';

interface AssetRecord {
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  amount?: string;
  num_accounts?: number;
  accounts?: { authorized?: number };
  balances?: { authorized?: string };
  liquidity_pools_amount?: string;
}

interface PoolRecord {
  id?: string;
  fee_bp?: number;
  total_trustlines?: string;
  total_shares?: string;
  reserves?: Array<{ asset?: string; amount?: string }>;
}

type AssetSort = 'holders' | 'supply';
type PoolSort = 'shares' | 'trustlines';

function SortHeader({
  label,
  active,
  onClick,
  align = 'right',
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  align?: 'left' | 'right';
}) {
  return (
    <th className={`px-3 py-2 text-${align}`}>
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold transition-colors ${
          active
            ? 'text-accent'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );
}

export function HomeRankedTables({
  assetsInitial = [],
  poolsInitial = [],
}: {
  assetsInitial?: AssetRecord[];
  poolsInitial?: PoolRecord[];
}) {
  const [assets, setAssets] = useState<AssetRecord[]>(assetsInitial);
  const [pools, setPools] = useState<PoolRecord[]>(poolsInitial);
  const [assetSort, setAssetSort] = useState<AssetSort>('holders');
  const [poolSort, setPoolSort] = useState<PoolSort>('shares');
  const [fetchError, setFetchError] = useState(false);
  const [fetching, setFetching] = useState(false);
  const mounted = useRef(true);

  const hasAnyData = assetsInitial.length > 0 || poolsInitial.length > 0;

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/horizon/testnet/assets-pools', { cache: 'no-store' });
      const json = await res.json();
      if (!mounted.current) return;
      if (!json?.success || !json.data) {
        setFetchError(true);
        return;
      }
      setFetchError(false);
      // Testnet proxy returns flat arrays: { data: { assets: [...], pools: [...] } }
      const a = (json.data.assets ?? []) as AssetRecord[];
      const p = (json.data.pools ?? []) as PoolRecord[];
      if (Array.isArray(a)) setAssets(a);
      if (Array.isArray(p)) setPools(p);
    } catch {
      if (mounted.current) setFetchError(hasAnyData);
    } finally {
      if (mounted.current) setFetching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (!hasAnyData) load();
    const id = setInterval(load, 120000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedAssets = useMemo(() => {
    const copy = [...assets];
    copy.sort((a, b) => {
      const aHolders = a.num_accounts ?? a.accounts?.authorized ?? 0;
      const bHolders = b.num_accounts ?? b.accounts?.authorized ?? 0;
      const aSupply = parseFloat(String(a.amount ?? a.balances?.authorized ?? '0')) || 0;
      const bSupply = parseFloat(String(b.amount ?? b.balances?.authorized ?? '0')) || 0;
      return assetSort === 'holders' ? bHolders - aHolders : bSupply - aSupply;
    });
    return copy.slice(0, 10);
  }, [assets, assetSort]);

  const sortedPools = useMemo(() => {
    const copy = [...pools];
    copy.sort((a, b) =>
      poolSort === 'shares'
        ? (parseFloat(b.total_shares ?? '0') || 0) - (parseFloat(a.total_shares ?? '0') || 0)
        : (parseFloat(b.total_trustlines ?? '0') || 0) - (parseFloat(a.total_trustlines ?? '0') || 0),
    );
    return copy.slice(0, 10);
  }, [pools, poolSort]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Top Assets */}
      <Card className="card-elevated">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Coins className="h-4 w-4 text-accent" /> Top Assets
              <span className="text-[9px] font-medium text-muted-foreground border border-border rounded px-1 py-0.5">Testnet</span>
            </h3>
            <div className="flex items-center gap-2">
              {fetching && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
              <Link href="/assets" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                All <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
          {fetching && sortedAssets.length === 0 ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 rounded skeleton-shimmer" />
              ))}
            </div>
          ) : fetchError && sortedAssets.length === 0 ? (
            <p className="text-xs text-muted-foreground px-4 py-6 text-center">
              Asset data temporarily unavailable. The API server may be offline or the snapshot hasn&apos;t warmed up yet.
            </p>
          ) : sortedAssets.length === 0 ? (
            <p className="text-xs text-muted-foreground px-4 py-6 text-center">
              No assets discovered on Pi Network yet. Data appears once Horizon indexes the first issued assets.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">#</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Asset</th>
                    <SortHeader label="Holders" active={assetSort === 'holders'} onClick={() => setAssetSort('holders')} />
                    <SortHeader label="Supply" active={assetSort === 'supply'} onClick={() => setAssetSort('supply')} />
                  </tr>
                </thead>
                <tbody>
                  {sortedAssets.map((a, i) => {
                    const holders = a.num_accounts ?? a.accounts?.authorized ?? 0;
                    const supplyRaw = parseFloat(String(a.amount ?? a.balances?.authorized ?? '0')) || 0;
                    return (
                    <tr key={`${a.asset_code}-${a.asset_issuer}-${i}`} className="border-b border-border/20 last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 text-muted-foreground text-xs">{i + 1}</td>
                      <td className="px-3 py-2">
                        <span className="font-semibold">{a.asset_code || (a.asset_type === 'native' ? 'Pi' : '?')}</span>
                        <span className="block text-[10px] text-muted-foreground font-mono">{shortHash(a.asset_issuer)}</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{fmtInt(holders)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{fmtCompact(supplyRaw)}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Liquidity Pools */}
      <Card className="card-elevated">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Droplets className="h-4 w-4 text-accent" /> Top Liquidity Pools
              <span className="text-[9px] font-medium text-muted-foreground border border-border rounded px-1 py-0.5">Testnet</span>
            </h3>
            <Link href="/pool" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              All <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          {fetching && sortedPools.length === 0 ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 rounded skeleton-shimmer" />
              ))}
            </div>
          ) : fetchError && sortedPools.length === 0 ? (
            <p className="text-xs text-muted-foreground px-4 py-6 text-center">
              Pool data temporarily unavailable. The API server may be offline or the snapshot hasn&apos;t warmed up yet.
            </p>
          ) : sortedPools.length === 0 ? (
            <p className="text-xs text-muted-foreground px-4 py-6 text-center">
              No liquidity pools discovered on Pi Network yet. Data appears once the first pools are created on Horizon.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">#</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Pool</th>
                    <SortHeader label="Shares" active={poolSort === 'shares'} onClick={() => setPoolSort('shares')} />
                    <SortHeader label="Trustlines" active={poolSort === 'trustlines'} onClick={() => setPoolSort('trustlines')} />
                  </tr>
                </thead>
                <tbody>
                  {sortedPools.map((p, i) => (
                    <tr key={`${p.id}-${i}`} className="border-b border-border/20 last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 text-muted-foreground text-xs">{i + 1}</td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs">{shortHash(p.id)}</span>
                        <span className="block text-[10px] text-muted-foreground">{((p.fee_bp ?? 0) / 100).toFixed(2)}% fee</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{fmtCompact(parseFloat(p.total_shares ?? '0') || 0)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{fmtInt(parseFloat(p.total_trustlines ?? '0') || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
