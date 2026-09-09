'use client';

import { useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/spinner';
import { TrendingUp } from 'lucide-react';

const TradingViewChart = dynamic(
  () => import('@/components/charts/TradingViewChart'),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[300px]"><Spinner /></div> }
);

export interface FollowerPoint {
  time: string;
  followers: number;
  following?: number;
  tweets?: number;
}

export interface CommunityGrowthStats {
  handle: string;
  name?: string;
  current: {
    followers: number;
    following: number;
    tweets: number;
    fetchedAt: string | null;
  };
  growth: {
    change1dAbs: number | null;
    change1dPct: number | null;
    change7dAbs: number | null;
    change7dPct: number | null;
    change30dAbs: number | null;
    change30dPct: number | null;
    totalGrowthPct: number | null;
    totalGrowthAbs: number | null;
  };
  allTimeHigh: number;
  snapshotCount: number;
}

interface CommunityGrowthChartProps {
  history: FollowerPoint[];
  stats?: CommunityGrowthStats | null;
  height?: number;
  legend?: string;
  loading?: boolean;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function fmtChange(n: number | null): string {
  if (n == null) return '—';
  const prefix = n >= 0 ? '+' : '';
  return `${prefix}${fmt(Math.abs(n))}`;
}

function changeColor(n: number | null): string {
  if (n == null) return 'text-muted-foreground';
  if (n > 0) return 'text-emerald-500';
  if (n < 0) return 'text-red-500';
  return 'text-muted-foreground';
}

export default function CommunityGrowthChart({
  history,
  stats,
  height = 350,
  legend,
  loading = false,
}: CommunityGrowthChartProps) {
  const seriesData = useMemo(() => {
    return history
      .filter((p) => p.followers > 0)
      .map((p) => ({
        time: (new Date(p.time).getTime() / 1000) as any,
        value: p.followers,
      }))
      .sort((a, b) => (a.time as number) - (b.time as number));
  }, [history]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[350px] bg-card/30 rounded-lg border border-border/30">
        <Spinner />
      </div>
    );
  }

  if (seriesData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] bg-card/30 rounded-lg border border-border/30 text-muted-foreground gap-2">
        <TrendingUp className="h-8 w-8" />
        <p className="text-sm">No follower history data yet</p>
        <p className="text-xs">Snapshots are recorded every 12 hours</p>
      </div>
    );
  }

  const latest = seriesData[seriesData.length - 1];
  const series = [
    {
      type: 'area' as const,
      data: seriesData,
      color: '#22c55e',
      topColor: 'rgba(34,197,94,0.25)',
      bottomColor: 'rgba(34,197,94,0.01)',
    },
  ];

  return (
    <div className="bg-card/50 rounded-lg border border-border/30 overflow-hidden">
      {(stats || legend) && (
        <div className="px-4 pt-4 pb-0">
          {legend && (
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold">{legend}</span>
              {stats && (
                <span className="text-xs text-muted-foreground">
                  ({stats.snapshotCount} snapshots)
                </span>
              )}
            </div>
          )}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
              <div>
                <p className="text-xs text-muted-foreground">Followers</p>
                <p className="text-lg font-bold">{fmt(stats.current.followers)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">24h Change</p>
                <p className={`text-lg font-bold ${changeColor(stats.growth.change1dAbs)}`}>
                  {fmtChange(stats.growth.change1dAbs)}
                  {stats.growth.change1dPct != null && (
                    <span className="text-xs ml-1">
                      ({stats.growth.change1dPct >= 0 ? '+' : ''}{stats.growth.change1dPct}%)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">7d Change</p>
                <p className={`text-lg font-bold ${changeColor(stats.growth.change7dAbs)}`}>
                  {fmtChange(stats.growth.change7dAbs)}
                  {stats.growth.change7dPct != null && (
                    <span className="text-xs ml-1">
                      ({stats.growth.change7dPct >= 0 ? '+' : ''}{stats.growth.change7dPct}%)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">All-Time High</p>
                <p className="text-lg font-bold">{fmt(stats.allTimeHigh)}</p>
              </div>
            </div>
          )}
        </div>
      )}
      <TradingViewChart series={series} height={height} gridVisible={false} crosshair={true} />
    </div>
  );
}
