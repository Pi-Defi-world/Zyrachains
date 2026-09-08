import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/get-backend-url';

const SERVER_URL = getBackendUrl();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const response = await fetch(`${SERVER_URL}/api/pi/staking`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    if (!response.ok) {
      return NextResponse.json({ effective_stake: 0, raw_stake: 0, boost_multiplier: 1 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Staking proxy error:', error);
    return NextResponse.json({ effective_stake: 0, raw_stake: 0, boost_multiplier: 1 });
  }
}
