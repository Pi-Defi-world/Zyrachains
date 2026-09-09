import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/get-backend-url';

const SERVER_URL = getBackendUrl();

export async function GET(request: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await params;
    const response = await fetch(`${SERVER_URL}/api/pct-monitor/balance-history/${address}`, {
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.ok ? 200 : response.status });
  } catch (error) {
    console.error('balance-history proxy:', error);
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
}
