'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, Activity, TrendingUp, TrendingDown, ExternalLink,
} from 'lucide-react';
import BalanceHistoryChart from '@/components/charts/BalanceHistoryChart';
import { useAggregateBalanceHistory } from '@/lib/use-chart-data';
import { useLanguage } from '@/context/languagecontext';
import { fmtPi, fmtPiCompact, fmtInt, shortHash, timeAgo } from '@/lib/format';

type MonitorType = 'pct' | 'cex';

interface SummaryData {
  walletsTracked: number;
  scannedWallets?: number;
  startingBalance: number | null;
  currentBalance: number | null;
  confirmedChanges: number;
  totalOut: number;
  netChange24h: number;
  latestCheck: string | null;
}

interface ChangeRow {
  id?: string;
  wallet: string;
  oldBalance: number;
  newBalance: number;
  change: number;
  detectedAt: string;
  ledger: number | null;
}

interface CexFlow {
  identifier: string;
  name: string;
  net24h: number;
  in24h: number;
  out24h: number;
}

const apiBase = (type: MonitorType) => (type === 'pct' ? '/api/pct-monitor' : '/api/cex-monitor');
const accent = (type: MonitorType) => (type === 'pct' ? '#22c55e' : '#f59e0b');

function StatCard({
  label, value, sub, icon: Icon, tone = 'neutral',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  tone?: 'neutral' | 'gain' | 'loss';
}) {
  const toneClass = tone === 'gain' ? 'text-success' : tone === 'loss' ? 'text-danger' : 'text-foreground';
  return (
    <Card className="card-elevated min-w-0 overflow-hidden">
      <CardContent className="p-3 sm:p-4 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-accent flex-shrink-0" />
          <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {label}
          </span>
        </div>
        <p className={`font-mono text-sm sm:text-base lg:text-lg font-bold tabular-nums truncate ${toneClass}`} title={value}>
          {value}
        </p>
        {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4">
          <div className="h-3 w-16 rounded mb-3 skeleton-shimmer" />
          <div className="h-6 w-24 rounded skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}

export function HomeMonitorsDashboard({ type }: { type: MonitorType }) {
  const { t } = useLanguage();
  const tStr = useCallback((key: string, vars?: Record<string, any>) => {
    const v = typeof vars === 'undefined' ? t(key) : t(key, vars);
    return Array.isArray(v) ? String(v[0]) : v;
  }, [t]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [changes, setChanges] = useState<ChangeRow[]>([]);
  const [flows, setFlows] = useState<CexFlow[] | null>(null);
  const [error, setError] = useState(false);
  const [range, setRange] = useState<'1d' | '7d' | '30d'>('7d');
  const { aggregateHistory, loading: aggLoading } = useAggregateBalanceHistory(type, range);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const [sumRes, chRes] = await Promise.all([
        fetch(`${apiBase(type)}/summary`, { cache: 'no-store' }),
        fetch(`${apiBase(type)}/changes?limit=8&hours=168`, { cache: 'no-store' }),
      ]);
      const sumJson = await sumRes.json();
      const chJson = await chRes.json();
      if (!mounted.current) return;
      if (sumJson?.success && sumJson.data) {
        setSummary(sumJson.data);
        setError(false);
      } else {
        setError(true);
      }
      if (chJson?.success && Array.isArray(chJson.data)) setChanges(chJson.data);
    } catch {
      if (mounted.current) setError(true);
    }
  }, [type]);

  useEffect(() => {
    mounted.current = true;
    setSummary(null);
    load();
    const id = setInterval(load, 60000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [load]);

  // CEX-only: per-exchange 24h flows
  useEffect(() => {
    if (type !== 'cex') {
      setFlows(null);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/v2/home/cex-flows', { cache: 'no-store' });
        const json = await res.json();
        if (active && json?.success && Array.isArray(json.data)) setFlows(json.data);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      active = false;
    };
  }, [type]);

  const detailHref = type === 'pct' ? '/pct-wallet-monitor' : '/cex-wallet-monitor';
  const title = type === 'pct' ? tStr('home.monitors.core_team_wallets') : tStr('home.monitors.exchange_wallets');
  const trackerType = type === 'pct' ? 'Core Team' : 'Exchange';

  if (error && !summary) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
        {tStr('home.monitors.data_unavailable', { title })}
      </div>
    );
  }

  if (!summary) return <Skeleton />;

  const maxFlow = flows && flows.length ? Math.max(...flows.map((f) => Math.max(f.in24h, f.out24h, 1))) : 1;

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <StatCard label={tStr('home.monitors.wallets_tracked')} value={fmtInt(summary.walletsTracked)} icon={Wallet} />
        <StatCard label={tStr('home.monitors.current_balance')} value={fmtPiCompact(summary.currentBalance ?? undefined)} icon={Activity} />
        <StatCard
          label={tStr('home.monitors.net_24h')}
          value={fmtPiCompact(summary.netChange24h)}
          icon={summary.netChange24h >= 0 ? TrendingUp : TrendingDown}
          tone={summary.netChange24h >= 0 ? 'gain' : 'loss'}
        />
        <StatCard label={tStr('home.monitors.total_out')} value={fmtPiCompact(summary.totalOut)} icon={ArrowUpFromLine} tone="loss" />
        <StatCard label={tStr('home.monitors.confirmed_changes')} value={fmtInt(summary.confirmedChanges)} icon={ArrowDownToLine} />
        <StatCard label={tStr('home.monitors.starting_balance')} value={fmtPiCompact(summary.startingBalance ?? undefined)} icon={Wallet} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Balance trend chart */}
        <Card className="card-elevated lg:col-span-2">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{tStr('home.monitors.aggregate_balance_trend')}</h3>
              <div className="flex gap-1 rounded-lg border border-border p-0.5">
                {(['1d', '7d', '30d'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
                      range === r ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <BalanceHistoryChart data={aggregateHistory} height={220} color={accent(type)} loading={aggLoading} />
          </CardContent>
        </Card>

        {/* Recent changes */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">{tStr('home.monitors.recent_balance_changes')}</h3>
            {changes.length === 0 ? (
              <p className="text-xs text-muted-foreground">{tStr('home.monitors.no_changes_recorded')}</p>
            ) : (
              <div className="space-y-1 max-h-[220px] overflow-y-auto">
                {changes.map((c, idx) => (
                  <Link
                    key={(c.id || c.wallet) + idx}
                    href={`/account/${c.wallet}`}
                    className="flex items-center justify-between gap-2 py-1.5 border-b border-border/20 last:border-0 hover:bg-muted/40 px-1 rounded"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono truncate">{shortHash(c.wallet)}</p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(c.detectedAt)}</p>
                    </div>
                    <span className={`text-[11px] font-mono font-semibold shrink-0 ${c.change >= 0 ? 'text-success' : 'text-danger'}`}>
                      {c.change >= 0 ? '+' : ''}{fmtPiCompact(c.change)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CEX per-exchange flows */}
      {type === 'cex' && flows && flows.length > 0 && (
        <Card className="card-elevated">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">{tStr('home.monitors.per_exchange_flow')}</h3>
            <div className="space-y-2.5">
              {flows.slice(0, 8).map((f) => (
                <div key={f.identifier} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium truncate max-w-[160px]">{f.name || shortHash(f.identifier)}</span>
                    <span className={`font-mono font-semibold ${f.net24h >= 0 ? 'text-success' : 'text-danger'}`}>
                      {f.net24h >= 0 ? '+' : ''}{fmtPiCompact(f.net24h)}
                    </span>
                  </div>
                  <div className="flex gap-1 h-1.5">
                    <div className="flex-1 bg-muted rounded-sm overflow-hidden flex justify-end">
                      <div className="bg-success/70 h-full rounded-sm" style={{ width: `${(f.in24h / maxFlow) * 100}%` }} />
                    </div>
                    <div className="flex-1 bg-muted rounded-sm overflow-hidden">
                      <div className="bg-danger/70 h-full rounded-sm" style={{ width: `${(f.out24h / maxFlow) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-success/70" /> {tStr('home.monitors.inflow')}</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-danger/70" /> {tStr('home.monitors.outflow')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <Link
          href={detailHref}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
        >
          {tStr('home.monitors.open_full_tracker', { type: trackerType })}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
