'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpDown, Wallet, ExternalLink } from 'lucide-react';
import { fmtPiCompact, shortHash } from '@/lib/format';

export interface WalletItem {
  identifier: string;
  name: string;
  category: 'CEX' | 'Core Team' | 'Generated' | string;
  balance: number | null;
}

const categoryColors: Record<string, string> = {
  CEX: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'Core Team': 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  Generated: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
};

type SortKey = 'balance' | 'name' | 'category';

export function HomeTopWallets({ wallets, rows = 25 }: { wallets: WalletItem[]; rows?: number }) {
  const [sortKey, setSortKey] = useState<SortKey>('balance');
  const [asc, setAsc] = useState(false);

  const totalTracked = useMemo(
    () => wallets.reduce((sum, w) => sum + (w.balance ?? 0), 0),
    [wallets],
  );

  const sorted = useMemo(() => {
    const copy = [...wallets];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'balance') cmp = (a.balance ?? 0) - (b.balance ?? 0);
      else if (sortKey === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else cmp = (a.category || '').localeCompare(b.category || '');
      return asc ? cmp : -cmp;
    });
    return copy.slice(0, rows);
  }, [wallets, sortKey, asc, rows]);

  const toggle = (key: SortKey) => {
    if (sortKey === key) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(key === 'name' || key === 'category');
    }
  };

  const Header = ({ label, k, align = 'right' }: { label: string; k: SortKey; align?: 'left' | 'right' }) => (
    <th className={`px-3 py-2 text-${align}`}>
      <button
        onClick={() => toggle(k)}
        className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold transition-colors ${
          sortKey === k ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );

  return (
    <Card className="card-elevated">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Wallet className="h-4 w-4 text-accent" /> Top Tracked Wallets
          </h3>
          <Link href="/pct-wallet-monitor" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            All <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        {sorted.length === 0 ? (
          <p className="text-xs text-muted-foreground px-4 py-6 text-center">Wallet leaderboard temporarily unavailable.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">#</th>
                  <Header label="Wallet" k="name" align="left" />
                  <Header label="Type" k="category" align="left" />
                  <Header label="Balance" k="balance" />
                  <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">% Tracked</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((w, i) => {
                  const pct = totalTracked > 0 ? ((w.balance ?? 0) / totalTracked) * 100 : 0;
                  return (
                    <tr key={w.identifier + i} className="border-b border-border/20 last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 text-muted-foreground text-xs">{i + 1}</td>
                      <td className="px-3 py-2">
                        <Link href={`/account/${w.identifier}`} className="hover:text-primary">
                          <span className="font-medium block truncate max-w-[160px]">{w.name || shortHash(w.identifier)}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{shortHash(w.identifier)}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${categoryColors[w.category] || 'bg-muted text-foreground'}`}>
                          {w.category}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums whitespace-nowrap">{fmtPiCompact(w.balance ?? undefined)}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="hidden sm:block w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className="text-[11px] font-mono text-muted-foreground tabular-nums w-12 text-right">{pct.toFixed(2)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
