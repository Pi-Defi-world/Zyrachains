import Link from 'next/link';
import { fetchSnapshot } from '@/lib/server-fetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ExternalLink, ArrowRightLeft, ShoppingCart } from 'lucide-react';

interface TxRecord {
  id?: string;
  hash?: string;
  created_at?: string;
  source_account?: string;
  operation_count?: number;
  successful?: boolean;
  fee_charged?: string;
  base_amount?: string;
  counter_amount?: string;
  base_asset_type?: string;
  counter_asset_type?: string;
  seller?: string;
  amount?: string;
  buying?: { asset_type?: string; asset_code?: string };
  selling?: { asset_type?: string; asset_code?: string };
}

type RealtimePayload = {
  transactions: TxRecord[];
  trades: TxRecord[];
  orders: TxRecord[];
  updatedAt: string;
};

function shortHash(h: string): string {
  if (!h || h.length < 20) return h || '\u2014';
  return `${h.slice(0, 6)}\u2026${h.slice(-4)}`;
}

function timeAgo(ts: string | undefined): string {
  if (!ts) return '\u2014';
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatAmount(amount: string | undefined): string {
  if (!amount) return '\u2014';
  const n = parseFloat(amount);
  if (isNaN(n)) return '\u2014';
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export async function HomeRealtimeTransactions() {
  let txRecords: TxRecord[] = [];
  let tradeRecords: TxRecord[] = [];
  let orderRecords: TxRecord[] = [];

  try {
    const [txRes, tradeRes] = await Promise.all([
      fetchSnapshot<{ records: TxRecord[] }>('latest-transactions', 12),
      fetchSnapshot<{ records: TxRecord[] }>('latest-trades', 15),
    ]);

    if (txRes.success && txRes.data) {
      txRecords = txRes.data.records || [];
    }
    if (tradeRes.success && tradeRes.data) {
      tradeRecords = tradeRes.data.records || [];
    }
  } catch {
    // fallback to empty
  }

  const combined = [
    ...txRecords.slice(0, 5).map((t) => ({ ...t, _type: 'tx' as const })),
    ...tradeRecords.slice(0, 5).map((t) => ({ ...t, _type: 'trade' as const })),
  ].sort((a, b) => {
    const da = new Date(a.created_at || '').getTime();
    const db = new Date(b.created_at || '').getTime();
    return db - da;
  }).slice(0, 10);

  const overallEmpty = combined.length === 0;

  return (
    <Card className="border-border/60 bg-card/40">
      <CardHeader className="pb-2 px-4 pt-4 sm:px-5 sm:pt-5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          Live Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-3 sm:px-0 sm:pb-4 space-y-0">
        {overallEmpty ? (
          <p className="text-xs text-muted-foreground px-4 py-2">No recent activity recorded yet.</p>
        ) : (
          <div className="max-h-[280px] overflow-y-auto space-y-0">
            {combined.map((item, idx) => {
              const isTx = item._type === 'tx';
              const isTrade = item._type === 'trade';

              return (
                <Link
                  key={(item.hash || item.id || idx.toString()) + idx}
                  href={isTx ? `/tx/${item.hash}` : `/trades-history`}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-muted/40 transition-colors border-b border-border/20 last:border-0"
                >
                  {isTx ? (
                    <Activity className="h-3 w-3 text-emerald-500 shrink-0" />
                  ) : (
                    <ArrowRightLeft className="h-3 w-3 text-amber-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-medium truncate max-w-[140px]">
                        {isTx
                          ? shortHash(item.hash || '')
                          : `${formatAmount(item.base_amount)} Pi`}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {timeAgo(item.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isTx ? (
                        <>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                            {shortHash(item.source_account || '')}
                          </span>
                          {item.operation_count != null && (
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {item.operation_count} ops
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                          {item.base_asset_type === 'native' ? 'Pi' : item.base_asset_type || 'N/A'}
                          {' / '}
                          {item.counter_asset_type === 'native' ? 'Pi' : item.counter_asset_type || 'N/A'}
                        </span>
                      )}
                      {isTx && item.successful === false && (
                        <span className="text-[10px] text-red-500 font-medium shrink-0">Failed</span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 opacity-50" />
                </Link>
              );
            })}
          </div>
        )}

        <div className="px-4 pt-2">
          <Link
            href="/realtime-transactions"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            <Activity className="h-3 w-3" />
            View real-time feed
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
