import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/get-backend-url';

const SERVER_URL = getBackendUrl();

export async function GET(request: NextRequest) {
  try {
    const qs = request.nextUrl.search;
    const response = await fetch(`${SERVER_URL}/api/addresses/top-accounts${qs}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        errorData || { success: false, error: 'Failed to fetch top accounts' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching top accounts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch top accounts' }, { status: 500 });
  }
}