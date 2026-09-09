import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/get-backend-url';

const SERVER_URL = getBackendUrl();

interface RouteContext {
  params: Promise<{ listingType: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { listingType } = await context.params;
    if (!listingType) {
      return NextResponse.json({ error: 'Listing type is required' }, { status: 400 });
    }

    const response = await fetch(`${SERVER_URL}/api/pi/payments/config/${listingType}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        errorData || { error: 'Failed to fetch payment config' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching payment config:', error);
    return NextResponse.json({ error: 'Failed to fetch payment config' }, { status: 500 });
  }
}