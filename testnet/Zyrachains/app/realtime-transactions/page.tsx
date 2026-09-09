"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/PageHeader";
import { SummaryStats } from "@/components/SummaryStats";
import { SkeletonTable } from "@/components/SkeletonTable";
import {
  RefreshCw,
  FileText,
  ArrowLeftRight,
  ShoppingCart,
  Activity,
  Pause,
  Play,
} from "lucide-react";
import { formatDistanceToNowWithLocale } from "@/utils/time";

type Tab = "transactions" | "trades" | "orders";

interface HorizonRecord {
  id?: string;
  hash?: string;
  successful?: boolean;
  ledger?: number;
  created_at?: string;
  source_account?: string;
  operation_count?: number;
  fee_charged?: string;
  base_amount?: string;
  counter_amount?: string;
  base_asset_type?: string;
  counter_asset_type?: string;
  price?: { n?: string; d?: string };
  seller?: string;
  amount?: string;
  buying?: { asset_type?: string; asset_code?: string };
  selling?: { asset_type?: string; asset_code?: string };
}

interface SnapshotData {
  transactions: HorizonRecord[];
  trades: HorizonRecord[];
  orders: HorizonRecord[];
  updatedAt: string;
}

const ORACLE_URL =
  process.env.NEXT_PUBLIC_ORACLE_URL?.replace(/\/$/, "") ||
  "https://api.zyrachain.org/";

function shortHash(h: string): string {
  if (!h || h.length < 20) return h || "—";
  return `${h.slice(0, 8)}…${h.slice(-6)}`;
}

function formatAmount(amount: string | undefined): string {
  if (!amount) return "—";
  const n = parseFloat(amount);
  if (isNaN(n)) return "—";
  if (n === 0) return "0";
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function formatTime(ts: string | undefined): string {
  if (!ts) return "—";
  try {
    return formatDistanceToNowWithLocale(new Date(ts), "en");
  } catch {
    return "—";
  }
}

function CountBadge({ count }: { count: number }) {
  return count > 0 ? (
    <span className="ml-1 text-[10px] text-muted-foreground">({count})</span>
  ) : null;
}

export default function RealtimeTransactionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("transactions");
  const [data, setData] = useState<SnapshotData>({
    transactions: [],
    trades: [],
    orders: [],
    updatedAt: "",
  });
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${ORACLE_URL}/realtime/snapshot`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          setLastUpdated(new Date());
          setError(null);
          
          if (data.transactions.length === 0 && data.trades.length === 0 && data.orders.length === 0) {
            setLoading(false);
          }
        }
      }
    } catch {
      setError("Reconnecting...");
    }
    
    if (loading && (data.transactions.length > 0 || data.trades.length > 0 || data.orders.length > 0)) {
      setLoading(false);
    }
  }, [loading, data.transactions.length, data.trades.length, data.orders.length]);

  useEffect(() => {
    fetchData().then(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      intervalRef.current = setInterval(fetchData, 5000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [paused, fetchData]);

  const currentRecords =
    activeTab === "transactions"
      ? data.transactions
      : activeTab === "trades"
        ? data.trades
        : data.orders;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "transactions", label: "Transactions", icon: <FileText className="h-4 w-4" /> },
    { key: "trades", label: "Trades", icon: <ArrowLeftRight className="h-4 w-4" /> },
    { key: "orders", label: "Orders", icon: <ShoppingCart className="h-4 w-4" /> },
  ];

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
        <PageHeader title="Real-time Transactions" description="Live blockchain transactions, trades, and orders from the Pi Network." />
        <SkeletonTable rows={10} cols={5} />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
      <PageHeader
        title="Real-time Transactions"
        description="Live blockchain transactions, trades, and orders from the Pi Network."
      >
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              Updated {formatDistanceToNowWithLocale(lastUpdated, "en")}
            </div>
          )}
          <Button
            onClick={() => setPaused(!paused)}
            variant="outline"
            size="sm"
          >
            {paused ? (
              <Play className="h-4 w-4 mr-1.5" />
            ) : (
              <Pause className="h-4 w-4 mr-1.5" />
            )}
            {paused ? "Resume" : "Pause"}
          </Button>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
        </div>
      </PageHeader>

      <SummaryStats
        stats={[
          {
            label: "Transactions",
            value: data.transactions.length.toLocaleString(),
            icon: <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
          },
          {
            label: "Trades",
            value: data.trades.length.toLocaleString(),
            icon: <ArrowLeftRight className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
          },
          {
            label: "Orders",
            value: data.orders.length.toLocaleString(),
            icon: <ShoppingCart className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
          },
          {
            label: "Status",
            value: paused ? "Paused" : error || "Live",
            icon: <Activity className={`h-4 w-4 ${paused ? "text-yellow-500" : "text-emerald-500"}`} />,
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {tabs.map((tab) => (
          <Badge
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            className="cursor-pointer px-3 py-1.5 text-xs sm:text-sm gap-1.5"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            {tab.label}
            <CountBadge count={data[tab.key]?.length || 0} />
          </Badge>
        ))}
      </div>

      <Card className="border-border/60">
        <CardHeader className="px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${paused ? "bg-yellow-400" : "bg-emerald-400"}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${paused ? "bg-yellow-500" : "bg-emerald-500"}`} />
            </span>
            {activeTab === "transactions"
              ? "Live Transactions"
              : activeTab === "trades"
                ? "Live Trades"
                : "Live Orders"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="overflow-x-auto -mx-4 sm:-mx-5">
            <Table>
              <TableHeader>
                {activeTab === "transactions" && (
                  <TableRow>
                    <TableHead className="text-xs">Hash</TableHead>
                    <TableHead className="text-xs">Age</TableHead>
                    <TableHead className="text-xs">Source Account</TableHead>
                    <TableHead className="text-xs text-right">Ops</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                )}
                {activeTab === "trades" && (
                  <TableRow>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Base Amount</TableHead>
                    <TableHead className="text-xs">Counter Amount</TableHead>
                    <TableHead className="text-xs">Base Asset</TableHead>
                    <TableHead className="text-xs">Counter Asset</TableHead>
                  </TableRow>
                )}
                {activeTab === "orders" && (
                  <TableRow>
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Seller</TableHead>
                    <TableHead className="text-xs">Selling</TableHead>
                    <TableHead className="text-xs">Buying</TableHead>
                    <TableHead className="text-xs text-right">Amount</TableHead>
                  </TableRow>
                )}
              </TableHeader>
              <TableBody>
                {currentRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                      Waiting for data... New items will appear here in real-time.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentRecords.map((record, i) => (
                    <TableRow key={(record.id || record.hash || i.toString()) + i}>
                      {activeTab === "transactions" && (
                        <>
                          <TableCell className="font-mono text-xs">
                            {record.hash ? (
                              <Link href={`/tx/${record.hash}`} className="text-primary hover:underline">
                                {shortHash(record.hash)}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatTime(record.created_at)}
                          </TableCell>
                          <TableCell className="max-w-[160px] truncate font-mono text-xs">
                            {record.source_account ? (
                              <Link href={`/account/${record.source_account}`} className="text-primary hover:underline">
                                {shortHash(record.source_account)}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {record.operation_count ?? "—"}
                          </TableCell>
                          <TableCell>
                            {record.successful === false ? (
                              <Badge variant="destructive" className="text-[10px]">Failed</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">OK</Badge>
                            )}
                          </TableCell>
                        </>
                      )}
                      {activeTab === "trades" && (
                        <>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatTime(record.created_at)}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {formatAmount(record.base_amount)}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {formatAmount(record.counter_amount)}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {record.base_asset_type === "native" ? "Pi" : record.base_asset_type || "—"}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {record.counter_asset_type === "native" ? "Pi" : record.counter_asset_type || "—"}
                          </TableCell>
                        </>
                      )}
                      {activeTab === "orders" && (
                        <>
                          <TableCell className="font-mono text-xs">
                            {record.id ? (
                              <Link href={`/operations/${record.id}`} className="text-primary hover:underline">
                                {shortHash(record.id)}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="max-w-[120px] truncate font-mono text-xs">
                            {record.seller ? (
                              <Link href={`/account/${record.seller}`} className="text-primary hover:underline">
                                {shortHash(record.seller)}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {record.selling?.asset_type === "native" ? "Pi" : record.selling?.asset_code || record.selling?.asset_type || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {record.buying?.asset_type === "native" ? "Pi" : record.buying?.asset_code || record.buying?.asset_type || "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {formatAmount(record.amount)}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
