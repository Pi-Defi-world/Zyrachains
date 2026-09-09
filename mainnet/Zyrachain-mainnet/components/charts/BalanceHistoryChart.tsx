'use client';
import TradingViewChart from './TradingViewChart';
import type { AreaData } from 'lightweight-charts';

interface BalancePoint {
  time: string;
  balance: number;
}

interface BalanceHistoryChartProps {
  data: BalancePoint[];
  address?: string;
  height?: number;
  color?: string;
  loading?: boolean;
}

export default function BalanceHistoryChart({
  data,
  address,
  height = 250,
  color = '#22c55e',
  loading,
}: BalanceHistoryChartProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading balance history...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
        No balance history yet
      </div>
    );
  }

  const areaData: AreaData[] = data.map((d) => ({
    time: d.time as any,
    value: d.balance,
  }));

  return (
    <TradingViewChart
      series={[
        {
          type: 'area',
          data: areaData,
          color,
          topColor: `${color}33`,
          bottomColor: `${color}05`,
        },
      ]}
      height={height}
      legend={address ? `Balance: ${address.slice(0, 8)}...` : 'Balance History'}
    />
  );
}
