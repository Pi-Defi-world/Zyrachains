'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/context/languagecontext';
import BalanceHistoryChart from '@/components/charts/BalanceHistoryChart';
import { useAggregateBalanceHistory } from '@/lib/use-chart-data';

interface SummaryData {
  walletsTracked: number;
  scannedWallets?: number;
  startingBalance: number | null;
  currentBalance: number | null;
  confirmedChanges: number;
  totalOut: number;
  netChange24h: number;
  latestCheck: string | null;
  scanLock: boolean;
}

interface ChangeRow {
  id: string;
  wallet: string;
  walletShort: string;
  oldBalance: number;
  newBalance: number;
  change: number;
  detectedAt: string;
  ledger: number | null;
}

interface WalletRow {
  identifier: string;
  walletShort: string;
  Name: string;
  explorerUrl: string;
  lastBalance: number | null;
  lastCheckedAt: string | null;
}

function fmtPi(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 7 })} π`;
}

function fmtInt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US');
}

function fmtUtc(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  } catch {
    return iso;
  }
}

export default function PctWalletMonitorPage() {
  const { t } = useLanguage();
  const tStr = useCallback((key: string) => {
    const v = t(key);
    return Array.isArray(v) ? String(v[0]) : v;
  }, [t]);
  const [tab, setTab] = useState('wallets');

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [summaryErr, setSummaryErr] = useState<string | null>(null);

  const [walletPage, setWalletPage] = useState(1);
  const [walletData, setWalletData] = useState<{
    wallets: WalletRow[];
    totalPages: number;
    total: number;
  } | null>(null);

  const [updatesRows, setUpdatesRows] = useState<ChangeRow[]>([]);
  const [historyRows, setHistoryRows] = useState<ChangeRow[]>([]);
  const [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [balanceRange, setBalanceRange] = useState<'1d' | '7d' | '30d'>('7d');
  const { aggregateHistory, loading: aggLoading } = useAggregateBalanceHistory('pct', balanceRange);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const v = new URLSearchParams(window.location.search).get('tab');
    if (v === 'wallets' || v === 'updates' || v === 'history') setTab(v);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  }, [tab]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/pct-monitor/summary');
      const j = await res.json();
      if (!j.success || !j.data) {
        setSummaryErr(tStr('pct.summary_error'));
        setSummary(null);
        return;
      }
      setSummaryErr(null);
      setSummary(j.data as SummaryData);
    } catch {
      setSummaryErr(tStr('pct.summary_error'));
    }
  }, [tStr]);

  useEffect(() => {
    loadSummary();
    const id = setInterval(loadSummary, 60000);
    return () => clearInterval(id);
  }, [loadSummary]);

  const loadWallets = useCallback(async () => {
    const res = await fetch(`/api/pct-monitor/wallets?page=${walletPage}&pageSize=100`);
    const j = await res.json();
    if (j.success && j.data) setWalletData(j.data);
  }, [walletPage]);

  useEffect(() => {
    if (tab === 'wallets') loadWallets();
  }, [tab, loadWallets]);

  const loadUpdates = useCallback(async () => {
    const res = await fetch('/api/pct-monitor/changes?limit=100&hours=168');
    const j = await res.json();
    if (j.success && Array.isArray(j.data)) setUpdatesRows(j.data);
  }, []);

  useEffect(() => {
    if (tab === 'updates') loadUpdates();
  }, [tab, loadUpdates]);

  const loadHistory = useCallback(
    async (cursor?: string | null, append?: boolean) => {
      setHistoryLoading(true);
      try {
        const q = new URLSearchParams({ limit: '50' });
        if (cursor) q.set('cursor', cursor);
        const res = await fetch(`/api/pct-monitor/changes?${q}`);
        const j = await res.json();
        if (j.success && Array.isArray(j.data)) {
          setHistoryRows((prev) => (append ? [...prev, ...j.data] : j.data));
          setHistoryCursor(j.nextCursor ?? null);
        }
      } finally {
        setHistoryLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (tab === 'history') {
      setHistoryRows([]);
      setHistoryCursor(null);
      loadHistory(null, false);
    }
  }, [tab, loadHistory]);

  const changeCellClass = (ch: number) =>
    ch < 0 ? 'text-destructive' : ch > 0 ? 'text-primary' : 'text-muted-foreground';

  return (
    <div className="pct-monitor min-h-screen bg-background text-foreground font-mono selection:bg-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight mb-1">
          {tStr('pct.title')}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">{tStr('pct.subtitle')}</p>

        {summaryErr && <p className="text-destructive text-sm mb-4">{summaryErr}</p>}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          <StatCard label={tStr('pct.stat_tracked')} value={fmtInt(summary?.walletsTracked)} accent="neutral" />
          <StatCard label={tStr('pct.stat_starting')} value={fmtPi(summary?.startingBalance ?? null)} accent="green" />
          <StatCard label={tStr('pct.stat_current')} value={fmtPi(summary?.currentBalance ?? null)} accent="green" />
          <StatCard label={tStr('pct.stat_changes')} value={fmtInt(summary?.confirmedChanges)} accent="neutral" />
          <StatCard label={tStr('pct.stat_total_out')} value={fmtPi(summary?.totalOut ?? null)} accent="red" />
          <StatCard label={tStr('pct.stat_24h')} value={fmtPi(summary?.netChange24h ?? null)} accent="mixed" val={summary?.netChange24h} />
        </div>

        {/* Balance Trend Chart — separate section */}
        <div className="rounded-xl border border-border/60 bg-card/95 overflow-hidden mb-8">
          <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-2">
            <h3 className="text-sm font-semibold text-foreground">{tStr('monitor.balance_trend')}</h3>
            <div className="flex gap-1">
              {(['1d', '7d', '30d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setBalanceRange(r)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    balanceRange === r
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="px-0">
            <BalanceHistoryChart data={aggregateHistory} color="#22c55e" height={220} loading={aggLoading} />
          </div>
        </div>

        {/* Tabs section — wallets / updates / history */}
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <TabsList className="flex flex-wrap gap-2 bg-transparent border-0 p-0">
              {(['wallets', 'updates', 'history'] as const).map((v) => (
                <TabsTrigger
                  key={v}
                  value={v}
                  className={
                    'rounded-full px-4 py-2 text-sm border transition-colors data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-accent data-[state=inactive]:border-border data-[state=inactive]:text-muted-foreground hover:bg-accent/60'
                  }
                >
                  {v === 'wallets' ? tStr('pct.tab_wallets') : v === 'updates' ? tStr('pct.tab_updates') : tStr('pct.tab_history')}
                </TabsTrigger>
              ))}
            </TabsList>
            <p className="text-xs text-muted-foreground">
              {tStr('pct.latest_check')}{' '}
              <span className="text-foreground">{fmtUtc(summary?.latestCheck ?? null)}</span>
              {summary?.scanLock ? ` · ${tStr('pct.scan_running')}` : ''}
              {summary?.scannedWallets !== undefined && summary.walletsTracked > 0
                ? ` · ${summary.scannedWallets.toLocaleString('en-US')}/${summary.walletsTracked.toLocaleString('en-US')} ${tStr('monitor.scanned')}`
                : ''}
            </p>
          </div>

          <TabsContent value="wallets" className="mt-0 border-0 p-0 bg-transparent shadow-none">
            <div className="rounded-xl border border-border bg-card/90 overflow-hidden">
              <ul className="divide-y divide-border/70 max-h-[560px] overflow-y-auto">
                {(walletData?.wallets ?? []).map((w) => (
                  <li key={w.identifier} className="hover:bg-accent/40">
                    <Link
                      href={`/account/${w.identifier}`}
                      className="flex flex-col sm:flex-row sm:items-center gap-1 px-4 py-3 text-primary hover:underline min-w-0"
                    >
                      <span className="hidden sm:inline text-xs text-muted-foreground break-all min-w-0">{w.identifier}</span>
                      <span className="sm:hidden text-sm truncate">{w.walletShort}</span>
                      <span className="hidden sm:inline text-sm">{w.walletShort}</span>
                      {w.lastBalance != null && (
                        <span className="sm:ml-auto text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                          {fmtPi(w.lastBalance)}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              {walletData && walletData.totalPages > 1 && (
                <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-border text-sm">
                  <button type="button" disabled={walletPage <= 1} onClick={() => setWalletPage((p) => Math.max(1, p - 1))} className="text-primary disabled:opacity-40">{tStr('pct.prev')}</button>
                  <span className="text-foreground">{walletPage} / {walletData.totalPages}</span>
                  <button type="button" disabled={walletPage >= walletData.totalPages} onClick={() => setWalletPage((p) => p + 1)} className="text-primary disabled:opacity-40">{tStr('pct.next')}</button>
                  <span className="text-muted-foreground text-xs ml-auto">{fmtInt(walletData.total)} {tStr('pct.wallets_index')}</span>
                </div>
              )}
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">{tStr('pct.footer_note')}</p>
          </TabsContent>

          <TabsContent value="updates" className="mt-0">
            <ChangesTable rows={updatesRows} changeCellClass={changeCellClass} tr={tStr} />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <ChangesTable rows={historyRows} changeCellClass={changeCellClass} tr={tStr} />
            <div className="flex justify-center mt-4">
              {historyCursor && (
                <button type="button" disabled={historyLoading} onClick={() => loadHistory(historyCursor, true)} className="rounded-full border border-border px-4 py-2 text-sm text-primary hover:bg-accent">
                  {historyLoading ? tStr('pct.loading') : tStr('pct.load_more')}
                </button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  val,
}: {
  label: string;
  value: string;
  accent: 'green' | 'red' | 'neutral' | 'mixed';
  val?: number | null;
}) {
  let cls = 'text-foreground';
  if (accent === 'green') cls = 'text-primary';
  if (accent === 'red') cls = 'text-destructive';
  if (accent === 'mixed' && val !== undefined && val !== null) {
    cls = val < 0 ? 'text-destructive' : val > 0 ? 'text-primary' : 'text-muted-foreground';
  }
  return (
    <div className="rounded-xl border border-border bg-card/95 px-3 py-4 shadow-sm min-w-0 overflow-hidden">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 truncate">{label}</div>
      <div className={`text-lg sm:text-xl font-semibold truncate ${cls}`}>{value}</div>
    </div>
  );
}

function ChangesTable({
  rows,
  changeCellClass,
  tr,
}: {
  rows: ChangeRow[];
  changeCellClass: (ch: number) => string;
  tr: (k: string) => string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/90 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground font-mono whitespace-normal">{tr('pct.col_wallet')}</TableHead>
            <TableHead className="text-muted-foreground font-mono whitespace-normal">{tr('pct.col_old')}</TableHead>
            <TableHead className="text-muted-foreground font-mono whitespace-normal">{tr('pct.col_new')}</TableHead>
            <TableHead className="text-muted-foreground font-mono whitespace-normal">{tr('pct.col_change')}</TableHead>
            <TableHead className="text-muted-foreground font-mono whitespace-normal">{tr('pct.col_detected')}</TableHead>
            <TableHead className="text-muted-foreground font-mono whitespace-normal">{tr('pct.col_ledger')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="border-border">
              <TableCell colSpan={6} className="text-muted-foreground text-center py-8">
                {tr('pct.no_changes')}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id} className="border-border hover:bg-accent/40">
                <TableCell className="font-mono text-[12px] max-w-[140px] truncate">
                  <Link
                    href={`/account/${r.wallet}`}
                    className="text-primary hover:underline"
                  >
                    {r.walletShort}
                  </Link>
                </TableCell>
                <TableCell className="text-foreground">{fmtPi(r.oldBalance)}</TableCell>
                <TableCell className="text-foreground">{fmtPi(r.newBalance)}</TableCell>
                <TableCell className={changeCellClass(r.change)}>{fmtPi(r.change)}</TableCell>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{fmtUtc(r.detectedAt)}</TableCell>
                <TableCell className="text-foreground">{r.ledger ?? '—'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
