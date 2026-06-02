import { NextRequest, NextResponse } from 'next/server';

const MEXC_BASE = 'https://api.mexc.com/api/v3/klines';

// Map UI range to MEXC interval + limit for a good chart
const INTERVAL_MAP: Record<string, { interval: string; limit: number }> = {
  '1d':  { interval: '15m', limit: 96 },   // 24h of 15min candles
  '7d':  { interval: '1h',  limit: 168 },  // 7d of 1h candles
  '30d': { interval: '4h',  limit: 180 },  // 30d of 4h candles
  '90d': { interval: '1d',  limit: 90 },   // 90d of daily candles
};

interface MexcKline {
  0: number; // open time (ms)
  1: string; // open
  2: string; // high
  3: string; // low
  4: string; // close
  5: string; // volume
  6: number; // close time (ms)
  7: string; // quote volume
}

export const dynamic = 'force-dynamic';
export const revalidate = 30; // 30s cache

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get('range') || '7d';
  const config = INTERVAL_MAP[range] || INTERVAL_MAP['7d'];

  try {
    const url = `${MEXC_BASE}?symbol=PIUSDT&interval=${config.interval}&limit=${config.limit}`;
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ data: [], source: 'empty' }, { status: 200 });
    }

    const raw: MexcKline[] = await res.json();

    const data = raw.map((k) => ({
      time: Math.floor(k[0] / 1000), // unix seconds for lightweight-charts
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));

    return NextResponse.json({ data, source: 'mexc' });
  } catch {
    return NextResponse.json({ data: [], source: 'error' }, { status: 200 });
  }
}
