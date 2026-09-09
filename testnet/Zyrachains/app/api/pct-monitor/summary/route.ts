import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/get-backend-url';

const SERVER_URL = getBackendUrl();

export async function GET() {
  try {
    const response = await fetch(`${SERVER_URL}/api/pct-monitor/summary`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(20000),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.ok ? 200 : response.status });
  } catch (error) {
    console.error('pct-monitor summary proxy:', error);
    return NextResponse.json(
      { success: false, message: 'Upstream unavailable', data: null },
      { status: 502 }
    );
  }
}
