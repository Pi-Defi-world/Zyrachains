"use client";

import { useState, useCallback } from "react";
import AssetsTab from "@/components/tabs/AssetsTab";
import { PageHeader } from "@/components/PageHeader";
import { SummaryStats } from "@/components/SummaryStats";
import { Coins, Wallet, Users, Database } from "lucide-react";

interface Asset {
  asset_type: string;
  asset_code?: string;
  accounts?: { authorized?: number };
  balances?: { authorized?: string };
  liquidity_pools_amount?: string;
  num_liquidity_pools?: number;
}

interface AssetsApiResponse {
  _embedded: { records: Asset[] };
}

export default function Assets() {
  const [stats, setStats] = useState({ total: 0, holders: 0, pools: 0, supply: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const hasInitialised = useState(() => false)[0]; // eslint-disable-line

  const handleLoad = useCallback((data: AssetsApiResponse, isInitial: boolean) => {
    if (isInitial) {
      const records = data._embedded?.records || [];
      const total = records.length;
      const holders = records.reduce((s, a) => s + (a.accounts?.authorized || 0), 0);
      const pools = records.reduce((s, a) => s + (a.num_liquidity_pools || 0), 0);
      const supply = records.reduce((s, a) => s + parseFloat(a.balances?.authorized || "0"), 0);
      setStats({ total, holders, pools, supply });
    }
    setInitialLoading(false);
  }, []);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
      <PageHeader
        title="Assets"
        description="Browse all assets on the Pi Network — view issuers, holders, supply, and liquidity pool participation."
      >
        {!initialLoading && (
          <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            {stats.total} assets
          </div>
        )}
      </PageHeader>

      {!initialLoading && (
        <SummaryStats
          stats={[
            { label: "Total Assets", value: stats.total.toLocaleString(), icon: <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> },
            { label: "Total Holders", value: stats.holders.toLocaleString(), icon: <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> },
            { label: "Liquidity Pools", value: stats.pools.toLocaleString(), icon: <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> },
            { label: "Circulating Supply", value: stats.supply.toLocaleString(undefined, { maximumFractionDigits: 0 }), icon: <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> },
          ]}
        />
      )}

      <AssetsTab onLoad={handleLoad} />
    </div>
  );
}
