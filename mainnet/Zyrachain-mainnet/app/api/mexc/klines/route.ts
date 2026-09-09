import { NextRequest, NextResponse } from 'next/server';

const MEXC_BASE = 'https://api.mexc.com/api/v3/klines';

const INTERVAL_MAP: Record<string, { interval: string; limit: number }> = {
  '24H': { interval: '15m', limit: 96 },
  '7D':  { interval: '60m', limit: 168 },
  '1M':  { interval: '4h',  limit: 180 },
  '3M':  { interval: '1d',  limit: 90 },
};

interface KlinePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const dynamic = 'force-dynamic';
export const revalidate = 30;

async function fetchMexcKlines(range: string): Promise<{ data: KlinePoint[]; source: string; error?: string }> {
  const config = INTERVAL_MAP[range];
  if (!config) return { data: [], source: 'empty', error: `Unknown range: ${range}` };

  const url = `${MEXC_BASE}?symbol=PIUSDT&interval=${config.interval}&limit=${config.limit}`;

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { data: [], source: 'empty', error: `MEXC HTTP ${res.status}: ${body.slice(0, 200)}` };
    }

    const raw: unknown = await res.json();

    if (!Array.isArray(raw)) {
      const err = raw as Record<string, unknown>;
      return { data: [], source: 'empty', error: `MEXC error: ${err.code || ''} ${err.msg || JSON.stringify(err).slice(0, 200)}` };
    }

    const data = (raw as (string | number)[][]).map((k) => ({
      time: Math.floor(Number(k[0]) / 1000),
      open: parseFloat(String(k[1])),
      high: parseFloat(String(k[2])),
      low: parseFloat(String(k[3])),
      close: parseFloat(String(k[4])),
      volume: parseFloat(String(k[5])),
    }));

    if (data.length === 0) {
      return { data: [], source: 'empty', error: 'MEXC returned empty kline array' };
    }

    return { data, source: 'mexc' };
  } catch (e) {
    return { data: [], source: 'error', error: `Fetch error: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get('range') || '7D';
  // Accept old names too
  const mapped = range === '1d' ? '24H' : range === '7d' ? '7D' : range === '30d' ? '1M' : range === '90d' ? '3M' : range;
  const result = await fetchMexcKlines(mapped || '7D');

  console.log(`[mexc-klines] range=${range} → ${(result.data || []).length} candles, error=${result.error || 'none'}`);

  return NextResponse.json(result);
}
