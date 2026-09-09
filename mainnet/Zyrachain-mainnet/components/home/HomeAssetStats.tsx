'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Coins, Users, Droplets, Wallet } from 'lucide-react';
import { fmtInt, fmtCompact } from '@/lib/format';

interface HomeAssetStatsProps {
  assets: Record<string, unknown>[];
  pools: Record<string, unknown>[];
}

export function HomeAssetStats({ assets, pools }: HomeAssetStatsProps) {
  const totalAssets = assets.length;

  // num_accounts may be a number, a string, or nested under accounts.authorized
  const totalHolders = assets.reduce((s, a) => {
    const n =
      typeof a.num_accounts === 'number' ? a.num_accounts
      : typeof a.num_accounts === 'string' ? parseFloat(a.num_accounts)
      : 0;
    // fallback: accounts.authorized (Horizon nested format)
    const accts = a.accounts as Record<string, unknown> | undefined;
    const auth = typeof accts?.authorized === 'number' ? accts!.authorized as number : 0;
    return s + Math.max(n, auth);
  }, 0);

  const totalPools = pools.length;

  // Horizon returns total authorized supply as either `amount` (string) or `balances.authorized`
  const totalSupply = assets.reduce((s, a) => {
    const amount = parseFloat(String(a.amount ?? '0')) || 0;
    const balAuth = parseFloat(String((a.balances as Record<string, unknown> | undefined)?.authorized ?? '0')) || 0;
    return s + Math.max(amount, balAuth);
  }, 0);

  const totalPoolShares = pools.reduce((s, p) => {
    const raw = p.total_shares;
    const n = typeof raw === 'string' ? parseFloat(raw) : typeof raw === 'number' ? raw : 0;
    return s + (isFinite(n) ? n : 0);
  }, 0);

  const totalTrustlines = pools.reduce((s, p) => {
    const raw = p.total_trustlines;
    const n = typeof raw === 'string' ? parseFloat(raw) : typeof raw === 'number' ? raw : 0;
    return s + (isFinite(n) ? n : 0);
  }, 0);

  const statCards = [
    { label: 'Total Assets', value: fmtInt(totalAssets), icon: Coins },
    { label: 'Total Holders', value: fmtInt(totalHolders), icon: Users },
    { label: 'Liquidity Pools', value: fmtInt(totalPools), icon: Droplets },
    { label: 'Circulating Supply', value: fmtCompact(totalSupply), icon: Wallet },
    { label: 'Pool Shares', value: fmtCompact(totalPoolShares), icon: Droplets },
    { label: 'Trustlines', value: fmtInt(totalTrustlines), icon: Users },
  ];

  if (totalAssets === 0 && totalPools === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
      {statCards.map((s) => (
        <Card key={s.label} className="card-elevated min-w-0 overflow-hidden">
          <CardContent className="p-2.5 sm:p-3 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <s.icon className="h-3.5 w-3.5 text-accent flex-shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                {s.label}
              </span>
            </div>
            <p className="font-mono font-bold text-foreground tabular-nums text-base sm:text-lg lg:text-xl truncate">
              {s.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
