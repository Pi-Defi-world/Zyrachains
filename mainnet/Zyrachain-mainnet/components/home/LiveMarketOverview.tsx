'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useSharedHero } from '@/lib/use-shared-hero';
import { fmtUsd, fmtMoneyCompact, fmtCompact, formatChange } from '@/lib/format';

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
  updatedAt?: string;
};

export function LiveMarketOverview({ initial }: { initial: HeroData }) {
  const { data: liveStore, live } = useSharedHero(initial);
  const d = (liveStore ?? initial) as HeroData;

  const fmt = (n: number) => n.toLocaleString('en-US');
  const fmtB = (n: number) => `${(n / 1e9).toFixed(2)}B`;

  return (
    <section className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 lg:gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1 card-elevated">
        <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</p>
            {live && (
              <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-accent">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
                </span>
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <p className="font-mono text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">{fmtUsd(d.priceUsd)}</p>
            {formatChange(d.priceChange24h) && (
              <span className={`font-mono text-xs sm:text-sm font-bold ${formatChange(d.priceChange24h)!.color}`}>
                {formatChange(d.priceChange24h)!.text}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground font-mono">
            <span>24h High: {d.high24hUsd != null ? fmtUsd(d.high24hUsd) : '\u2014'}</span>
            <span>24h Low: {d.low24hUsd != null ? fmtUsd(d.low24hUsd) : '\u2014'}</span>
          </div>
          <div className="pt-3 sm:pt-4 border-t border-border space-y-2 sm:space-y-3">
            <div>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">Market Cap</span>
              <p className="font-mono text-sm sm:text-base md:text-lg lg:text-lg font-bold text-foreground mt-1">{fmtMoneyCompact(d.market_cap_usd)}</p>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">FDV</span>
              <p className="font-mono text-sm sm:text-base md:text-lg lg:text-lg font-bold text-foreground mt-1">{fmtMoneyCompact(d.fdv_usd)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1 card-elevated">
        <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6">
          <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 sm:mb-4">Supply</p>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Circulating</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-foreground">{fmtB(d.total_circulating_supply)}</span>
            </div>
            <div className="w-full bg-muted rounded-md h-2 overflow-hidden">
              <div className="bg-accent h-full rounded-md transition-all duration-500" style={{ width: `${(d.total_circulating_supply / d.total_supply) * 100}%` }} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Supply</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-foreground">{fmtB(d.total_supply)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Locked</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-foreground">{fmtB(d.total_locked)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Unlocked %</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-accent">
                {((1 - d.total_locked / d.total_supply) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1 card-elevated">
        <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6">
          <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 sm:mb-4">Network</p>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Block</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-foreground">#{d.latest_block?.toLocaleString() || '\u2014'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">TPS</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-foreground">{typeof d.tps === 'number' ? d.tps.toFixed(2) : '\u2014'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Circ / Locked</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-foreground">
                {((d.total_circulating_supply - d.total_locked) / 1e9).toFixed(2)}B / {fmtB(d.total_locked)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Utilization</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-accent">
                {((d.total_circulating_supply / d.total_supply) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
