'use client';
import TradingViewChart from './TradingViewChart';
import type { CandlestickData, HistogramData } from 'lightweight-charts';

interface PriceChartPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface PriceChartProps {
  data: PriceChartPoint[];
  height?: number;
  showVolume?: boolean;
  legend?: string;
  loading?: boolean;
}

export default function PriceChart({ data, height = 400, showVolume = true, legend, loading }: PriceChartProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading price data...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
        No price history yet — data starts accumulating once the price oracle cron begins
      </div>
    );
  }

  const candleData: CandlestickData[] = data.map((d) => ({
    time: d.time as any,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
  }));

  const series: any[] = [
    {
      type: 'candlestick',
      data: candleData,
      upColor: '#22c55e',
      downColor: '#ef4444',
    },
  ];

  if (showVolume && data[0]?.volume) {
    const volumeData: HistogramData[] = data.map((d) => ({
      time: d.time as any,
      value: d.volume || 0,
      color: d.close >= d.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
    }));
    series.push({
      type: 'histogram',
      data: volumeData,
      color: '#22c55e',
    });
  }

  return (
    <TradingViewChart
      series={series}
      height={height}
      legend={legend}
      crosshair
    />
  );
}
