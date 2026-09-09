"use client";

import { useState, useCallback } from "react";
import PoolTab from "@/components/tabs/PoolTab";
import { PageHeader } from "@/components/PageHeader";
import { SummaryStats } from "@/components/SummaryStats";
import { Droplets, Users, BarChart3, RefreshCw } from "lucide-react";
import TradingViewChart from "@/components/charts/TradingViewChart";
import type { HistogramData } from "lightweight-charts";

interface Reserve {
  asset?: string;
  amount?: string;
}

interface Pool {
  id?: string;
  total_trustlines?: string;
  total_shares?: string;
  reserves?: Reserve[];
}

export default function Pools() {
  const [stats, setStats] = useState({ total: 0, trustlines: 0, reservesCount: 0, sharesTotal: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [pools, setPools] = useState<Pool[]>([]);

  const handlePoolsLoad = useCallback((p: Pool[]) => {
    setPools(p);
    const total = p.length;
    const trustlines = p.reduce((sum, pool) => sum + parseInt(pool.total_trustlines || "0"), 0);
    const sharesTotal = p.reduce((sum, pool) => sum + parseFloat(pool.total_shares || "0"), 0);
    const reservesCount = p.reduce((sum, pool) => sum + (pool.reserves?.length || 0), 0);
    setStats({ total, trustlines, reservesCount, sharesTotal });
    setInitialLoading(false);
  }, []);

  const shareData: HistogramData[] = pools
    .filter((p) => parseFloat(p.total_shares || "0") > 0)
    .slice(0, 30)
    .map((p, i) => ({
      time: (Math.floor(Date.now() / 1000) - (pools.length - i) * 86400) as any,
      value: parseFloat(parseFloat(p.total_shares || "0").toFixed(2)),
      color: "#22c55e",
    }));

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
      <PageHeader
        title="Liquidity Pools"
        description="View liquidity pools on the Pi Network — track reserves, trustlines, and shares."
      >
        <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
          {!initialLoading && `${stats.total} pools loaded`}
        </div>
      </PageHeader>

      {!initialLoading && (
        <>
          <SummaryStats
            stats={[
              { label: "Total Pools", value: stats.total.toLocaleString(), icon: <Droplets className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> },
              { label: "Total Trustlines", value: stats.trustlines.toLocaleString(), icon: <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> },
              { label: "Total Shares", value: stats.sharesTotal.toLocaleString(undefined, { maximumFractionDigits: 0 }), icon: <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> },
              { label: "Reserve Entries", value: stats.reservesCount.toLocaleString(), icon: <RefreshCw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> },
            ]}
          />

          {shareData.length > 0 && (
            <div className="rounded-xl border border-border bg-card/95 p-4 mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Pool Shares Distribution (Top 30)</h3>
              <TradingViewChart
                series={[{ type: 'histogram', data: shareData, color: '#22c55e' }]}
                height={200}
              />
            </div>
          )}
        </>
      )}

      <PoolTab onLoad={handlePoolsLoad} />
    </div>
  );
}
