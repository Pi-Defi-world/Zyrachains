'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpDown, Droplets, ExternalLink } from 'lucide-react';
import { fmtCompact, fmtInt, shortHash } from '@/lib/format';

interface PoolRecord {
  id?: string;
  fee_bp?: number;
  total_trustlines?: string;
  total_shares?: string;
  reserves?: Array<{ asset?: string; amount?: string }>;
}

type SortKey = 'shares' | 'trustlines';

export function HomePoolsTable({ pools }: { pools: PoolRecord[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('shares');
  const [asc, setAsc] = useState(false);

  const toggle = (key: SortKey) => {
    if (sortKey === key) setAsc((v) => !v);
    else { setSortKey(key); setAsc(false); }
  };

  const sorted = useMemo(() => {
    const copy = [...pools];
    copy.sort((a, b) => {
      const aVal = sortKey === 'shares'
        ? (parseFloat(String(a.total_shares ?? '0')) || 0)
        : (parseFloat(String(a.total_trustlines ?? '0')) || 0);
      const bVal = sortKey === 'shares'
        ? (parseFloat(String(b.total_shares ?? '0')) || 0)
        : (parseFloat(String(b.total_trustlines ?? '0')) || 0);
      return asc ? aVal - bVal : bVal - aVal;
    });
    return copy.slice(0, 50);
  }, [pools, sortKey, asc]);

  const Header = ({ label, k }: { label: string; k: SortKey }) => (
    <th className="px-3 py-2 text-right">
      <button onClick={() => toggle(k)} className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold transition-colors ${sortKey === k ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}>
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );

  if (pools.length === 0) {
    return (
      <p className="text-xs text-muted-foreground px-4 py-6 text-center">
        No liquidity pools discovered on Pi testnet yet.
      </p>
    );
  }

  return (
    <Card className="card-elevated">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Droplets className="h-4 w-4 text-accent" /> Liquidity Pools
            <span className="text-[9px] font-medium text-muted-foreground border border-border rounded px-1 py-0.5">Testnet</span>
          </h3>
          <Link href="/pool" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            Full page <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">#</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Pool ID</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Fee</th>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Reserves</th>
                <Header label="Shares" k="shares" />
                <Header label="Trustlines" k="trustlines" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => {
                const reserves = (p.reserves ?? []).map((r) =>
                  `${fmtCompact(parseFloat(String(r.amount ?? '0')) || 0)} ${r.asset === 'native' ? 'Pi' : (r.asset || '?')}`,
                ).join(' / ') || '\u2014';
                return (
                  <tr key={`${p.id}-${i}`} className="border-b border-border/20 last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2 text-muted-foreground text-xs">{i + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs">{shortHash(p.id)}</td>
                    <td className="px-3 py-2">{((p.fee_bp ?? 0) / 100).toFixed(2)}%</td>
                    <td className="px-3 py-2 text-xs font-mono max-w-[200px] truncate">{reserves}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{fmtCompact(parseFloat(String(p.total_shares ?? '0')) || 0)}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{fmtInt(parseFloat(String(p.total_trustlines ?? '0')) || 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
