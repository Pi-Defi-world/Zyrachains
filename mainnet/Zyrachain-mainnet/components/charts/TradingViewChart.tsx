'use client';
import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  Time,
  LineData,
  CandlestickData,
  HistogramData,
  AreaData,
} from 'lightweight-charts';

type SeriesConfig =
  | { type: 'line'; data: LineData[]; color?: string; lineWidth?: number }
  | { type: 'area'; data: AreaData[]; color?: string; topColor?: string; bottomColor?: string }
  | { type: 'candlestick'; data: CandlestickData[]; upColor?: string; downColor?: string }
  | { type: 'histogram'; data: HistogramData[]; color?: string };

interface TradingViewChartProps {
  series: SeriesConfig[];
  height?: number;
  timeRange?: { from: Time; to: Time };
  crosshair?: boolean;
  gridVisible?: boolean;
  legend?: string;
}

function isDarkTheme(): boolean {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

function getThemeColors(isDark: boolean) {
  return {
    background: 'transparent',
    textColor: isDark ? '#d1d5db' : '#374151',
    gridColor: isDark ? '#1f2937' : '#e5e7eb',
    crosshairColor: isDark ? '#6b7280' : '#9ca3af',
  };
}

export default function TradingViewChart({
  series,
  height = 300,
  timeRange,
  crosshair = true,
  gridVisible = true,
  legend,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ISeriesApi<any>[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>(isDarkTheme() ? 'dark' : 'light');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(isDarkTheme() ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const hasData = series.some((s) => s.data && s.data.length > 0);
    if (!hasData) return;
    const colors = getThemeColors(theme === 'dark');

    if (chartRef.current) {
      chartRef.current.remove();
      seriesRefs.current = [];
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.textColor,
      },
      grid: {
        vertLines: { visible: gridVisible, color: colors.gridColor },
        horzLines: { visible: gridVisible, color: colors.gridColor },
      },
      width: containerRef.current.clientWidth,
      height,
      crosshair: crosshair ? { mode: CrosshairMode.Normal } : { mode: CrosshairMode.Hidden },
      rightPriceScale: { borderColor: colors.gridColor },
      timeScale: { borderColor: colors.gridColor, timeVisible: true, secondsVisible: false },
    });

    chartRef.current = chart;

    series.forEach((s) => {
      let api: ISeriesApi<any>;
      switch (s.type) {
        case 'line':
          api = chart.addSeries(LineSeries, { color: s.color || '#22c55e', lineWidth: (s.lineWidth || 2) as any });
          api.setData(s.data);
          break;
        case 'area':
          api = chart.addSeries(AreaSeries, {
            lineColor: s.color || '#22c55e',
            topColor: s.topColor || 'rgba(34,197,94,0.3)',
            bottomColor: s.bottomColor || 'rgba(34,197,94,0.01)',
          });
          api.setData(s.data);
          break;
        case 'candlestick':
          api = chart.addSeries(CandlestickSeries, {
            upColor: s.upColor || '#22c55e',
            downColor: s.downColor || '#ef4444',
            borderDownColor: s.downColor || '#ef4444',
            borderUpColor: s.upColor || '#22c55e',
            wickDownColor: s.downColor || '#ef4444',
            wickUpColor: s.upColor || '#22c55e',
          });
          api.setData(s.data);
          break;
        case 'histogram':
          api = chart.addSeries(HistogramSeries, {
            color: s.color || '#22c55e',
            priceFormat: { type: 'volume' },
          });
          api.setData(s.data);
          break;
      }
      seriesRefs.current.push(api);
    });

    if (timeRange) {
      chart.timeScale().setVisibleRange({ from: timeRange.from, to: timeRange.to });
    }

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRefs.current = [];
    };
  }, [series, height, theme, crosshair, gridVisible, timeRange]);

  return (
    <div className="relative w-full">
      {legend && (
        <div className="absolute top-2 left-3 z-10 text-xs font-medium text-muted-foreground">
          {legend}
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}
