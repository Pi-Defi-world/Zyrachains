import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 15; // 15s cache

export async function GET() {
  try {
    const res = await fetch('https://api.mexc.com/api/v3/ticker/24hr?symbol=PIUSDT');
    const json = await res.json() as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      data: {
        priceUsd: parseFloat(String(json.lastPrice ?? '0')) || 0,
        high24hUsd: parseFloat(String(json.highPrice ?? '0')) || 0,
        low24hUsd: parseFloat(String(json.lowPrice ?? '0')) || 0,
        open24hUsd: parseFloat(String(json.openPrice ?? '0')) || 0,
        priceChange24h: parseFloat(String(json.priceChangePercent ?? '0')) || 0,
        volume24h: parseFloat(String(json.volume ?? '0')) || 0,
        source: 'mexc',
        updatedAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'MEXC ticker unavailable' }, { status: 200 });
  }
}
