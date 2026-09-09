import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/get-backend-url';

const SERVER_URL = getBackendUrl();

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.toString();
    const url = `${SERVER_URL}/api/pct-monitor/wallets${q ? `?${q}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(20000),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.ok ? 200 : response.status });
  } catch (error) {
    console.error('pct-monitor wallets proxy:', error);
    return NextResponse.json(
      { success: false, message: 'Upstream unavailable', data: null },
      { status: 502 }
    );
  }
}
