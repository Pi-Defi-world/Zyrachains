'use client';

import { useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { DollarSign, Hash, Globe, Box, Lock, Zap, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Sparkline, type SparklineDataPoint } from '@/components/charts/Sparkline';
import { useMobileLabel } from '@/hooks/use-mobile-labels';
import { usePriceHistory } from '@/lib/use-chart-data';
import { useSharedHero } from '@/lib/use-shared-hero';
import { fmtUsd, fmtMoneyCompact, fmtCompact, fmtInt, formatChange } from '@/lib/format';

type HeroData = {
  priceUsd: number;
  total_circulating_supply: number;
  total_supply: number;
  total_locked: number;
  latest_block: number;
  tps: number;
  market_cap_usd?: number;
  priceChange24h?: number;
  marketCapChange24h?: number;
  updatedAt?: string;
};

interface MetricConfig {
  key: string;
  label: string;
  icon: LucideIcon;
}

const metricConfig: MetricConfig[] = [
  { key: 'price', label: 'Price', icon: DollarSign },
  { key: 'mcap', label: 'Market Cap', icon: TrendingUp },
  { key: 'block', label: 'Block', icon: Hash },
  { key: 'circ', label: 'Circulating', icon: Globe },
  { key: 'supply', label: 'Supply', icon: Box },
  { key: 'locked', label: 'Locked', icon: Lock },
  { key: 'tps', label: 'TPS', icon: Zap },
];

function MetricCard({
  cfg, value, fullValue, showChange, changePct, sparklineData,
}: {
  cfg: MetricConfig;
  value: string;
  fullValue: string;
  showChange: boolean;
  changePct?: number;
  sparklineData?: SparklineDataPoint[] | null;
}) {
  const Icon = cfg.icon;
  const abbrevLabel = useMobileLabel(cfg.label);
  const change = showChange ? formatChange(changePct) : null;
  const priceUp = sparklineData && sparklineData.length >= 2
    ? sparklineData[sparklineData.length - 1].value >= sparklineData[0].value
    : true;

  return (
    <Card className="card-elevated min-w-0 overflow-hidden">
      <CardContent className="p-2.5 sm:p-3 md:p-4 lg:p-5 space-y-1.5 sm:space-y-2">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
          <span className="text-[9px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {abbrevLabel}
          </span>
        </div>
        <p
          title={fullValue}
          className="font-mono font-bold text-foreground leading-tight tabular-nums w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-base sm:text-lg md:text-xl lg:text-[clamp(0.95rem,1.4vw,1.5rem)]"
        >
          {value}
        </p>
        {change && !change.isFlat ? (
          <span className={`inline-flex items-center text-[10px] sm:text-xs font-bold ${change.color}`}>
            {change.isGain ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {change.text}
          </span>
        ) : sparklineData && sparklineData.length > 0 ? (
          <div className="flex justify-start -ml-1">
            <Sparkline data={sparklineData} height={20} isPositive={priceUp} />
          </div>
        ) : (
          <span className="block h-[16px]" />
        )}
      </CardContent>
    </Card>
  );
}

export function LiveHeroGrid({ initial }: { initial: HeroData }) {
  const { data: liveStore, live, updatedAt } = useSharedHero(initial);
  const d = (liveStore ?? initial) as HeroData;
  const { priceHistory } = usePriceHistory('24H');

  const priceSparkline: SparklineDataPoint[] = useMemo(
    () => priceHistory.map((p) => ({ time: p.time, value: p.close })),
    [priceHistory],
  );

  const values: Record<string, string> = useMemo(() => ({
    price: fmtUsd(d.priceUsd),
    mcap: d.market_cap_usd ? fmtMoneyCompact(d.market_cap_usd) : '\u2014',
    block: d.latest_block ? fmtInt(d.latest_block) : '\u2014',
    circ: fmtCompact(d.total_circulating_supply),
    supply: fmtCompact(d.total_supply),
    locked: fmtCompact(d.total_locked),
    tps: typeof d.tps === 'number' ? d.tps.toFixed(2) : '\u2014',
  }), [d]);

  const fullValues: Record<string, string> = useMemo(() => ({
    price: fmtUsd(d.priceUsd),
    mcap: d.market_cap_usd ? `$${fmtInt(d.market_cap_usd)}` : '\u2014',
    block: d.latest_block ? fmtInt(d.latest_block) : '\u2014',
    circ: `${fmtInt(d.total_circulating_supply)} Pi`,
    supply: `${fmtInt(d.total_supply)} Pi`,
    locked: `${fmtInt(d.total_locked)} Pi`,
    tps: typeof d.tps === 'number' ? d.tps.toFixed(2) : '\u2014',
  }), [d]);

  return (
    <section>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
        {metricConfig.map((cfg) => (
          <MetricCard
            key={cfg.key}
            cfg={cfg}
            value={values[cfg.key]}
            fullValue={fullValues[cfg.key]}
            showChange={cfg.key === 'price' || cfg.key === 'mcap'}
            changePct={cfg.key === 'price' ? d.priceChange24h : cfg.key === 'mcap' ? d.marketCapChange24h : undefined}
            sparklineData={cfg.key === 'price' ? priceSparkline : null}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-right mt-4">
        {live && (
          <span className="inline-flex items-center gap-2 mr-3 text-accent font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            LIVE
          </span>
        )}
        {updatedAt ? `Updated ${new Date(updatedAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' })}` : (d.updatedAt ? `Updated ${new Date(d.updatedAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' })}` : '')}
      </p>
    </section>
  );
}
