'use client';
import useSWR from 'swr';
import { useCallback } from 'react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PriceHistoryPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface BalanceHistoryPoint {
  time: string;
  balance: number;
}

export function usePriceHistory(range: '1d' | '7d' | '30d' | '90d' = '7d') {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/mexc/klines?range=${range}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const points: PriceHistoryPoint[] = data?.data ?? [];

  return {
    priceHistory: points,
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

export function useBalanceHistory(address: string | null) {
  const { data, error, isLoading } = useSWR(
    address ? `/api/pct-monitor/balance-history/${address}` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const points: BalanceHistoryPoint[] = data?.data ?? [];

  return {
    balanceHistory: points,
    loading: isLoading,
    error,
  };
}

export function useAggregateBalanceHistory(type: 'pct' | 'cex', range: '1d' | '7d' | '30d' = '7d') {
  const { data, error, isLoading } = useSWR(
    `/api/${type === 'pct' ? 'pct-monitor' : 'cex-monitor'}/aggregate-balance-history?range=${range}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  const points: BalanceHistoryPoint[] = data?.data ?? [];

  return {
    aggregateHistory: points,
    loading: isLoading,
    error,
  };
}

export function useTradesVolume(range: '1d' | '7d' | '30d' = '7d') {
  const { data, error, isLoading } = useSWR(
    `/api/trades/volume-history?range=${range}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  const points: { time: string; volume: number }[] = data?.data ?? [];

  return {
    volumeHistory: points,
    loading: isLoading,
    error,
  };
}

export function usePoolHistory() {
  const { data, error, isLoading } = useSWR(
    '/api/pool/history',
    fetcher,
    { refreshInterval: 60000 }
  );

  return {
    poolHistory: data?.data ?? [],
    loading: isLoading,
    error,
  };
}
