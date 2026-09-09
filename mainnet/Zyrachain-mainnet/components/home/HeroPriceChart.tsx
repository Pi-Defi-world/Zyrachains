'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, ShieldCheck, TrendingUp } from 'lucide-react';
import type { AreaData } from 'lightweight-charts';
import { usePriceHistory } from '@/lib/use-chart-data';
import { useSharedHero } from '@/lib/use-shared-hero';
import { fmtUsd, fmtMoneyCompact, formatChange } from '@/lib/format';

const PriceChart = dynamic(() => import('@/components/charts/PriceChart'), { ssr: false });
const TradingViewChart = dynamic(() => import('@/components/charts/TradingViewChart'), { ssr: false });

type Range = '24H' | '7D' | '1M' | '3M';
const RANGES: Range[] = ['24H', '7D', '1M', '3M'];

export type HeroPriceData = {
  priceUsd: number;
  priceChange24h?: number;
  high24hUsd?: number;
  low24hUsd?: number;
  market_cap_usd?: number;
  confidenceScore?: number;
  updatedAt?: string;
};

const MAX_LIVE_POINTS = 400;

interface LivePoint {
  time: number;
  value: number;
}

export function HeroPriceChart({ initial }: { initial: HeroPriceData }) {
  const [range, setRange] = useState<Range>('7D');
  const { data: liveStore, live } = useSharedHero(initial);
  const d = (liveStore ?? initial) as HeroPriceData;
  const { priceHistory, loading } = usePriceHistory(range);
  const hasHistory = !loading && priceHistory.length > 0;

  // Build live point buffer from the shared hero poll
  const [livePoints, setLivePoints] = useState<LivePoint[]>([]);
  const prevTime = useRef(0);
  useEffect(() => {
    if (!d || d.priceUsd == null) return;
    const now = Math.floor(Date.now() / 1000);
    const time = now > prevTime.current ? now : prevTime.current + 1;
    prevTime.current = time;
    setLivePoints((prev) => {
      const next = [...prev, { time, value: d.priceUsd }];
      return next.length > MAX_LIVE_POINTS ? next.slice(-MAX_LIVE_POINTS) : next;
    });
  }, [d]);

  const change = formatChange(d.priceChange24h);
  const confidence =
    d.confidenceScore != null
      ? Math.round(d.confidenceScore * (d.confidenceScore <= 1 ? 100 : 1))
      : null;

  return (
    <Card className="card-elevated">
      <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                PI / USD
              </span>
              {live && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-accent">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
                  </span>
                  LIVE
                </span>
              )}
              {confidence != null && (
                <span
                  title="Oracle confidence score across price sources"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground border border-border rounded px-1.5 py-0.5"
                >
                  <ShieldCheck className="h-3 w-3 text-success" />
                  {confidence}%
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-mono text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tabular-nums">
                {fmtUsd(d.priceUsd)}
              </span>
              {change && (
                <span className={`inline-flex items-center font-mono text-sm font-bold ${change.color}`}>
                  {!change.isFlat &&
                    (change.isGain ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    ))}
                  {change.text}
                </span>
              )}
            </div>
            <div className="flex gap-3 text-[11px] sm:text-xs text-muted-foreground font-mono">
              <span>24h H: {fmtUsd(d.high24hUsd)}</span>
              <span>24h L: {fmtUsd(d.low24hUsd)}</span>
              {d.market_cap_usd != null && (
                <span>MCap: {fmtMoneyCompact(d.market_cap_usd)}</span>
              )}
            </div>
          </div>

          <div className="flex gap-1 rounded-lg border border-border p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  range === r
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-80 text-muted-foreground text-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Loading price data...</span>
            </div>
          </div>
        ) : hasHistory ? (
          <PriceChart data={priceHistory} height={320} showVolume={false} legend="PI/USD" />
        ) : livePoints.length >= 2 ? (
          <div className="h-80 border border-dashed border-border rounded-lg p-4">
            <LiveAreaChart points={livePoints} />
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              Building from live data &mdash; full OHLC candles appear once the oracle accumulates enough history
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-80 text-muted-foreground text-sm border border-dashed border-border rounded-lg px-6">
            <TrendingUp className="h-8 w-8 mb-3 opacity-40" />
            <p className="font-medium mb-1">Waiting for price data...</p>
            <p className="text-xs text-center max-w-md">
              Connecting to the price oracle. The chart will appear once the first few data points arrive.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LiveAreaChart({ points }: { points: LivePoint[] }) {
  if (points.length < 2) return null;

  const deduped: LivePoint[] = [];
  for (const p of points) {
    const last = deduped.length > 0 ? deduped[deduped.length - 1] : null;
    if (!last || p.time > last.time) deduped.push(p);
    else if (p.time === last.time) {
      deduped[deduped.length - 1] = p;
    }
  }

  if (deduped.length < 2) return null;

  const areaData: AreaData[] = deduped.map((p) => ({
    time: p.time as any,
    value: p.value,
  }));

  return (
    <TradingViewChart
      series={[
        {
          type: 'area',
          data: areaData,
          color: '#22c55e',
          topColor: '#22c55e33',
          bottomColor: '#22c55e05',
        },
      ]}
      height={300}
      legend="PI/USD (live)"
      crosshair
    />
  );
}
