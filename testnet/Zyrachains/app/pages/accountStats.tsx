"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/languagecontext";
import apiClient from '@/lib/api-client';
import { usePageMetadata } from "@/context/pagemetadataContext";
import { horizon } from "@/api/horizon";
import { okx } from "@/api/okx";
import { socialchain } from "@/api/socialchain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { RefreshCw, TrendingUp, Users, Coins, Activity, Zap } from "lucide-react";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import PriceChart from "@/components/charts/PriceChart";
import { usePriceHistory } from "@/lib/use-chart-data";

const AccountStats: React.FC = () => {
  const { t, language } = useLanguage();
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const [topAccounts, setTopAccounts] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [priceRange, setPriceRange] = useState<'24H' | '7D' | '1M' | '3M'>('7D');
  const { priceHistory, loading: chartLoading } = usePriceHistory(priceRange);

  // Local state for data
  const [piPrice, setPiPrice] = useState(2.0);
  const [piSupply, setPiSupply] = useState(0);
  const [latestBlock, setLatestBlock] = useState(0);
  const [tps, setTps] = useState(0);

  // Fetch Pi price
  const fetchPiPrice = useCallback(async () => {
    try {
      const marketData = await okx.getMarketData();
      setPiPrice(parseFloat(marketData.idxPx || '2.0'));
    } catch (error) {
      console.error("Error fetching Pi price:", error);
    }
  }, []);

  // Fetch supply data
  const fetchSupply = useCallback(async () => {
    try {
      const supplyData = await socialchain.getSupply();
      setPiSupply(supplyData.total_circulating_supply);
    } catch (error) {
      console.error("Error fetching supply data:", error);
    }
  }, []);

  // Fetch network stats
  const fetchStats = useCallback(async () => {
    try {
      const [blockData, tpsData] = await Promise.all([
        horizon.getLatestBlock(),
        horizon.getTps()
      ]);
      setLatestBlock(blockData);
      setTps(tpsData);
    } catch (error) {
      console.error("Error fetching network stats:", error);
    }
  }, []);

  // Fetch top accounts
  const fetchTopAccounts = useCallback(async (page: number) => {
    try {
      const data = await apiClient.getTopAccounts(page);
      if (data.success) {
        setTopAccounts(data.data);
      }
    } catch (error) {
      console.error("Error fetching top accounts:", error);
    }
  }, []);

  // Fetch distribution data
  const fetchDistributionData = useCallback(async () => {
    try {
      const data = await apiClient.getAddressDistribution();
      if (data.success) {
        setDistributionData(data.data);
      }
    } catch (error) {
      console.error("Error fetching distribution data:", error);
    }
  }, []);

  // Main data fetching function
  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchPiPrice(),
        fetchSupply(),
        fetchStats(),
        fetchTopAccounts(currentPage),
        fetchDistributionData()
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPiPrice, fetchSupply, fetchStats, fetchTopAccounts, fetchDistributionData, currentPage]);

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    fetchInitialData();
  }, [fetchData]);

  // Set page metadata
  useEffect(() => {
    setHeading(String(t('account_stats.heading')) || 'Account Statistics');
    setTitle(String(t('account_stats.title')) || 'Account Statistics - Clubhouse Pi');
    setDescription(String(t('account_stats.description')) || 'Pi Network account statistics and data');
  }, [setHeading, setTitle, setDescription, t]);

  const handleRefresh = () => {
    fetchData();
  };

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString(language, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPrice = (amount: number): string => {
    return amount.toLocaleString(language, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Compute 24h change from price history
  const priceChange24h = priceHistory.length >= 2
    ? ((priceHistory[priceHistory.length - 1].close - priceHistory[0].close) / priceHistory[0].close * 100)
    : 0;
  const marketCap = piPrice * piSupply;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading account statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* CMC-style header row: refresh left, title right */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t('account_stats.heading')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('account_stats.description')}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatLastUpdated(lastUpdated)}</span>
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
              <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* === CMC-STYLE PRICE HEADER === */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-4xl sm:text-5xl font-bold tabular-nums text-foreground">
              ${formatPrice(piPrice)}
            </span>
            <span className={`text-lg font-semibold tabular-nums ${priceChange24h >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {priceChange24h >= 0 ? '▲' : '▼'} {Math.abs(priceChange24h).toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">Pi / USD</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">Market Cap ${formatAmount(marketCap)}</span>
          </div>
        </div>

        {/* === CHART SECTION (CMC STYLE) === */}
        <Card className="mb-6 overflow-hidden border-border/60">
          <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Pi Price Chart</span>
            </div>
            <div className="flex gap-1">
              {(['24H', '7D', '1M', '3M'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setPriceRange(r)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    priceRange === r
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <CardContent className="p-0">
            <PriceChart
              data={priceHistory}
              height={380}
              loading={chartLoading}
              legend={`Pi/USD — ${priceRange}`}
            />
          </CardContent>
        </Card>

        {/* === STATS CARDS (BELOW CHART) === */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Market Cap</p>
            <p className="text-lg font-semibold text-foreground">${formatAmount(marketCap)}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Circulating Supply</p>
            <p className="text-lg font-semibold text-foreground">{formatAmount(piSupply)} π</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Latest Block</p>
            <p className="text-lg font-semibold text-foreground">{formatAmount(latestBlock)}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">TPS</p>
            <p className="text-lg font-semibold text-foreground">{formatAmount(tps)}</p>
          </div>
        </div>

        {/* === BOTTOM SECTIONS === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2" />
                Top Accounts by Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {topAccounts.map((account, index) => (
                  <div key={account.address} className="flex items-center justify-between p-3 border border-border/60 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium shrink-0">
                        {index + 1}
                      </span>
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{account.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatAmount(account.balance)} π
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(account.balance * piPrice)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {((account.balance / piSupply) * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Distribution Chart */}
          {distributionData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Account Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%" cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {distributionData.map((_: any, idx: number) => (
                          <Cell key={idx} fill={['#16a34a', '#22c55e', '#FFBB28', '#FF8042'][idx % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
};

export default AccountStats;