'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LiveHeroGrid } from '@/components/home/LiveHeroGrid';
/* import { LiveMarketOverview } from '@/components/home/LiveMarketOverview'; */
import { LiveTicker } from '@/components/home/LiveTicker';
import { HeroPriceChart } from '@/components/home/HeroPriceChart';
import { HomeRankedTables } from '@/components/home/HomeRankedTables';
import { HomeTopWallets } from '@/components/home/HomeTopWallets';
import { LiveActivityFeed } from '@/components/home/LiveActivityFeed';
import { HomeMonitorsDashboard } from '@/components/home/HomeMonitorsDashboard';
import { HomePoolsTable } from '@/components/home/HomePoolsTable';
import { HomeAssetStats } from '@/components/home/HomeAssetStats';
import { HomeSocialSection } from '@/components/home/HomeSocialSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Building2, Users, ExternalLink, Activity } from 'lucide-react';
import type { SnapshotResponse } from '@/lib/server-fetch';

type TabType = 'overview' | 'wallets' | 'transactions' | 'assets' | 'pools' | 'supply' | 'network' | 'monitors' | 'social';
type MonitorSubTab = 'pct' | 'cex';

const tabs: { id: TabType; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'wallets', label: 'Wallets' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'assets', label: 'Assets' },
  { id: 'pools', label: 'Pools' },
  { id: 'supply', label: 'Supply' },
  { id: 'network', label: 'Network' },
  { id: 'monitors', label: 'Monitors' },
  { id: 'social', label: 'Social' },
];

type HeroData = {
  priceUsd: number;
  market_cap_usd: number;
  fdv_usd: number;
  total_circulating_supply: number;
  total_supply: number;
  total_locked: number;
  latest_block: number;
  tps: number;
  high24hUsd?: number;
  low24hUsd?: number;
  priceChange24h?: number;
  marketCapChange24h?: number;
  confidenceScore?: number;
  updatedAt?: string;
};

type PulseData = {
  netChange24hCoreTeam: number;
  netChange24hCex: number;
  largestMoves24h: Array<{
    wallet: string;
    change: number;
    detectedAt: string;
  }>;
};

type WalletItem = {
  identifier: string;
  name: string;
  category: 'CEX' | 'Core Team' | 'Generated';
  balance: number | null;
};

type TopWalletsData = {
  wallets: WalletItem[];
};

interface HomePageProps {
  hero: SnapshotResponse<HeroData>;
  pulse: SnapshotResponse<PulseData>;
  wallets: SnapshotResponse<TopWalletsData>;
  assets?: Record<string, unknown>[];
  pools?: Record<string, unknown>[];
  tickerVolumeUsd?: number | null;
  tickerPairs?: number | null;
}

function SectionSkeleton({ className, count }: { className: string; count: number }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="h-4 w-24 rounded-md mb-3 skeleton-shimmer" />
          <div className="h-8 w-32 rounded-md skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}

export function HomePage({
  hero, pulse, wallets,
  assets = [], pools = [], tickerVolumeUsd = null, tickerPairs = null,
}: HomePageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [activeMonitorSubTab, setActiveMonitorSubTab] = useState<MonitorSubTab>('pct');

  const heroData = hero.success && hero.data ? hero.data : null;
  const pulseData = pulse.success && pulse.data ? pulse.data : null;
  const walletsData = wallets.success && wallets.data ? wallets.data : null;

  return (
    <>
      {/* Live ticker strip */}
      <LiveTicker
        initialVolumeUsd={tickerVolumeUsd}
        initialPairs={tickerPairs}
      />

      <main className="w-full px-3 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10 max-w-7xl mx-auto">
        <div className="border-b border-border mb-6 sm:mb-8 flex gap-0 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap min-h-12 sm:min-h-auto ${
                activeTab === tab.id
                  ? 'border-accent text-accent bg-accent/5 hover:bg-accent/10'
                  : 'border-transparent text-foreground/60 hover:text-foreground/80 hover:bg-secondary/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in-0">
              {heroData ? (
                <HeroPriceChart initial={heroData} />
              ) : (
                <section className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
                  Market overview temporarily unavailable. Ensure the API server is running and snapshots have warmed.
                </section>
              )}

              {heroData && <LiveHeroGrid initial={heroData} />}

              {/* Market Overview section removed */}
              

              {/* Network Activity — commented: requires PCT/CEX wallet monitors to be seeded with addresses */}
              {/*
              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Network Activity</h2>
                <PulseSectionContent data={pulseData} />
              </section>
              */}

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Testnet Assets & Pools</h2>
                <HomeAssetStats assets={assets} pools={pools} />
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">On-chain Rankings</h2>
                <HomeRankedTables assetsInitial={assets} poolsInitial={pools} />
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Wallets</h2>
                {walletsData ? (
                  <HomeTopWallets wallets={walletsData.wallets} />
                ) : (
                  <section className="rounded border border-dashed border-border p-5 text-sm text-muted-foreground text-center">
                    Wallet leaderboard temporarily unavailable.
                  </section>
                )}
              </section>

              <section className="space-y-3">
                <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                  Live Activity
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </h2>
                <LiveActivityFeed />
              </section>
            </div>
          )}

          {/* Wallets Tab */}
          {activeTab === 'wallets' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in-0">
              <section className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Top Tracked Wallets</h2>
                <p className="text-sm text-muted-foreground">
                  Wallet leaderboard ranked by balance. Data sourced from the backend wallet monitoring system.
                </p>
                {walletsData ? (
                  <HomeTopWallets wallets={walletsData.wallets} />
                ) : (
                  <section className="rounded border border-dashed border-border p-5 text-sm text-muted-foreground text-center">
                    Wallet leaderboard temporarily unavailable.
                  </section>
                )}
              </section>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in-0">
              <section className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Real-time Activity</h2>
                <LiveActivityFeed />
              </section>
            </div>
          )}

          {/* Assets Tab */}
          {activeTab === 'assets' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in-0">
              <section className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Testnet Assets &amp; Pools</h2>
                <p className="text-sm text-muted-foreground">
                  Aggregated from Pi Network testnet Horizon. Mainnet has no issued assets yet.
                </p>
                <HomeAssetStats assets={assets} pools={pools} />
              </section>
              <section className="space-y-3">
                <HomeRankedTables assetsInitial={assets} poolsInitial={pools} />
              </section>
            </div>
          )}

          {/* Pools Tab */}
          {activeTab === 'pools' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in-0">
              <section className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Liquidity Pools</h2>
                <p className="text-sm text-muted-foreground">
                  All liquidity pools on Pi Network testnet.
                </p>
                <HomePoolsTable pools={pools} />
              </section>
            </div>
          )}

          {/* Supply Tab */}
          {activeTab === 'supply' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in-0">
              {/* Supply Metrics section removed */}
              
              {heroData && <LiveHeroGrid initial={heroData} />}
            </div>
          )}

          {/* Network Tab — Network Activity commented */}
          {activeTab === 'network' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in-0">
              <section className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Network Statistics</h2>
                {heroData ? (
                  <LiveHeroGrid initial={heroData} />
                ) : (
                  <section className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
                    Market overview temporarily unavailable.
                  </section>
                )}
              </section>
              {/* Network Activity commented — requires backend monitor seeding */}
              {/*
              <section className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">Network Activity</h3>
                <PulseSectionContent data={pulseData} />
              </section>
              */}
              <section className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">On-chain Rankings</h3>
                <HomeRankedTables assetsInitial={assets} poolsInitial={pools} />
              </section>
            </div>
          )}

          {/* Monitors Tab */}
          {activeTab === 'monitors' && (
            <div className="space-y-5 animate-in fade-in-0">
              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Wallet Monitors</h2>
                <p className="text-sm text-muted-foreground">
                  Live balance intelligence for Pi Core Team and exchange wallets — data you won&apos;t find anywhere else.
                </p>
                <div className="flex gap-2 border-b border-border">
                  <button
                    onClick={() => setActiveMonitorSubTab('pct')}
                    className={`px-4 sm:px-6 py-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${
                      activeMonitorSubTab === 'pct'
                        ? 'border-accent text-accent bg-accent/5'
                        : 'border-transparent text-foreground/60 hover:text-foreground/80'
                    }`}
                  >
                    Core Team
                  </button>
                  <button
                    onClick={() => setActiveMonitorSubTab('cex')}
                    className={`px-4 sm:px-6 py-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${
                      activeMonitorSubTab === 'cex'
                        ? 'border-accent text-accent bg-accent/5'
                        : 'border-transparent text-foreground/60 hover:text-foreground/80'
                    }`}
                  >
                    Exchange
                  </button>
                </div>
              </div>
              <HomeMonitorsDashboard type={activeMonitorSubTab} />
            </div>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in-0">
              <HomeSocialSection />
            </div>
          )}

        </div>
      </main>
    </>
  );
}

function PulseSectionContent({ data }: { data: PulseData | null }) {
  if (!data) {
    return (
      <section className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground text-center">
        Pulse metrics will appear once balance data is available.
      </section>
    );
  }

  const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 4 });

  return (
    <section className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
      <Card className="border-border/60 bg-card/40">
        <CardHeader className="pb-2 px-4 pt-4 sm:px-5 sm:pt-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-500" />
            Core Team (24h)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
          <p className={`text-2xl font-bold ${data.netChange24hCoreTeam >= 0 ? 'text-success' : 'text-danger'}`}>
            {data.netChange24hCoreTeam >= 0 ? '+' : ''}{fmt(data.netChange24hCoreTeam)}
            <span className="text-sm font-normal text-muted-foreground ml-1">Pi</span>
          </p>
          <div className="flex items-center gap-1 mt-1">
            {data.netChange24hCoreTeam >= 0
              ? <ArrowUpRight className="h-3.5 w-3.5 text-success" />
              : <ArrowDownRight className="h-3.5 w-3.5 text-danger" />}
            <span className="text-xs text-muted-foreground">net 24h flow</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/40">
        <CardHeader className="pb-2 px-4 pt-4 sm:px-5 sm:pt-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-500" />
            CEX Exchanges (24h)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
          <p className={`text-2xl font-bold ${data.netChange24hCex >= 0 ? 'text-success' : 'text-danger'}`}>
            {data.netChange24hCex >= 0 ? '+' : ''}{fmt(data.netChange24hCex)}
            <span className="text-sm font-normal text-muted-foreground ml-1">Pi</span>
          </p>
          <div className="flex items-center gap-1 mt-1">
            {data.netChange24hCex >= 0
              ? <ArrowUpRight className="h-3.5 w-3.5 text-success" />
              : <ArrowDownRight className="h-3.5 w-3.5 text-danger" />}
            <span className="text-xs text-muted-foreground">net 24h flow</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/40">
        <CardHeader className="pb-2 px-4 pt-4 sm:px-5 sm:pt-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-success" />
            Largest Moves (24h)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
          {data.largestMoves24h.length === 0 ? (
            <p className="text-xs text-muted-foreground">No moves recorded in the last 24h.</p>
          ) : (
            <div className="space-y-1">
              {data.largestMoves24h.slice(0, 7).map((m, idx) => (
                <div key={`${m.wallet}-${idx}`} className="flex items-center justify-between gap-2 py-1 border-b border-border/20 last:border-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-mono truncate max-w-[100px] sm:max-w-[160px]">{m.wallet}</span>
                    <Link href={`/account/${m.wallet}`} className="shrink-0 text-muted-foreground hover:text-primary">
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  <span className={`text-xs font-semibold shrink-0 ${m.change >= 0 ? 'text-success' : 'text-danger'}`}>
                    {m.change >= 0 ? '+' : ''}{fmt(m.change)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export function PulseSectionContent({ data }: { data: PulseData | null }) {
