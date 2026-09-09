import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/get-backend-url';

const SERVER_URL = getBackendUrl();

export async function GET(request: NextRequest) {
  try {
    const range = request.nextUrl.searchParams.get('range') || '7d';
    const response = await fetch(`${SERVER_URL}/api/cex-monitor/aggregate-balance-history?range=${range}`, {
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.ok ? 200 : response.status });
  } catch (error) {
    console.error('cex aggregate-balance-history proxy:', error);
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
}
