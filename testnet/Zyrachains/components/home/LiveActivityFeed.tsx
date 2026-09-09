'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, ArrowRightLeft, Layers, Pause, Play, ExternalLink } from 'lucide-react';
import { shortHash, timeAgo, fmtCompact } from '@/lib/format';

type Kind = 'tx' | 'trade' | 'op';

interface FeedItem {
  _kind: Kind;
  _key: string;
  hash?: string;
  id?: string;
  created_at?: string;
  source_account?: string;
  operation_count?: number;
  successful?: boolean;
  type?: string;
  amount?: string;
  base_amount?: string;
  base_asset_type?: string;
  counter_asset_type?: string;
  base_asset_code?: string;
  counter_asset_code?: string;
}

const POLL_MS = 7000;
const MAX_ROWS = 30;

type Filter = 'all' | 'tx' | 'trade' | 'op';

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'tx', label: 'Txns' },
  { id: 'trade', label: 'Trades' },
  { id: 'op', label: 'Ops' },
];

function assetLabel(type?: string, code?: string) {
  if (type === 'native') return 'Pi';
  return code || type || '?';
}

export function LiveActivityFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [paused, setPaused] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const seenIds = useRef<Set<string>>(new Set());
  const newIds = useRef<Set<string>>(new Set());
  const mounted = useRef(true);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const load = useCallback(async () => {
    if (pausedRef.current) return;
    try {
      const [txRes, trRes, opRes] = await Promise.all([
        fetch('/api/v2/home/latest-transactions', { cache: 'no-store' }),
        fetch('/api/v2/home/latest-trades', { cache: 'no-store' }),
        fetch('/api/v2/home/latest-ops', { cache: 'no-store' }),
      ]);
      const [txJson, trJson, opJson] = await Promise.all([txRes.json(), trRes.json(), opRes.json()]);
      if (!mounted.current) return;

      const tx: FeedItem[] = (txJson?.data?.records ?? []).map((r: any) => ({
        ...r, _kind: 'tx' as const, _key: `tx-${r.hash || r.id}`,
      }));
      const tr: FeedItem[] = (trJson?.data?.records ?? []).map((r: any, i: number) => ({
        ...r, _kind: 'trade' as const, _key: `trade-${r.id || r.base_offer_id || i}-${r.ledger_close_time || r.created_at || ''}`,
      }));
      const op: FeedItem[] = (opJson?.data?.records ?? []).map((r: any) => ({
        ...r, _kind: 'op' as const, _key: `op-${r.id}`,
      }));

      const merged = [...tx, ...tr, ...op]
        .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
        .slice(0, MAX_ROWS);

      // Detect new keys for entrance animation
      const fresh = new Set<string>();
      for (const it of merged) {
        if (!seenIds.current.has(it._key)) fresh.add(it._key);
      }
      newIds.current = fresh;
      seenIds.current = new Set(merged.map((m) => m._key));

      setItems(merged);
      setLive(true);
      setError(merged.length === 0);
      setLoading(false);
    } catch {
      if (mounted.current) {
        setError((e) => (items.length === 0 ? true : e));
        setLoading(false);
      }
    }
  }, [items.length]);

  useEffect(() => {
    mounted.current = true;
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = items.filter((i) => filter === 'all' || i._kind === filter);

  return (
    <Card className="border-border/60 bg-card/40">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            Live Activity
            {live && !paused && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
            )}
          </h3>
          <button
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1"
          >
            {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {paused ? 'Resume' : 'Pause'}
          </button>
        </div>

        <div className="flex gap-1 px-3 py-2 border-b border-border/40">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                filter === f.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-2 space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 rounded skeleton-shimmer" />
            ))}
          </div>
        ) : error && visible.length === 0 ? (
          <p className="text-xs text-muted-foreground px-4 py-6 text-center">No live activity available right now.</p>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {visible.map((it) => {
              const isNew = newIds.current.has(it._key) && !paused;
              const href = it._kind === 'tx' ? `/tx/${it.hash}`
                : it._kind === 'op' ? `/operations`
                : `/trades-history`;
              return (
                <Link
                  key={it._key}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 hover:bg-muted/40 transition-colors border-b border-border/20 last:border-0 ${isNew ? 'row-enter' : ''}`}
                >
                  {it._kind === 'tx' && <Activity className="h-3 w-3 text-emerald-500 shrink-0" />}
                  {it._kind === 'trade' && <ArrowRightLeft className="h-3 w-3 text-amber-500 shrink-0" />}
                  {it._kind === 'op' && <Layers className="h-3 w-3 text-sky-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-medium truncate max-w-[150px]">
                        {it._kind === 'tx' && shortHash(it.hash)}
                        {it._kind === 'trade' && `${fmtCompact(parseFloat(it.base_amount || '0') || 0)} Pi`}
                        {it._kind === 'op' && (it.type || 'operation').replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(it.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {it._kind === 'tx' && (
                        <>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[110px]">{shortHash(it.source_account)}</span>
                          {it.operation_count != null && <span className="text-[10px] text-muted-foreground shrink-0">{it.operation_count} ops</span>}
                          {it.successful === false && <span className="text-[10px] text-danger font-medium shrink-0">Failed</span>}
                        </>
                      )}
                      {it._kind === 'trade' && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {assetLabel(it.base_asset_type, it.base_asset_code)} / {assetLabel(it.counter_asset_type, it.counter_asset_code)}
                        </span>
                      )}
                      {it._kind === 'op' && (
                        <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{shortHash(it.source_account)}</span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 opacity-50" />
                </Link>
              );
            })}
          </div>
        )}

        <div className="px-4 py-2 border-t border-border/40">
          <Link href="/realtime-transactions" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            <Activity className="h-3 w-3" /> Open full real-time feed
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
