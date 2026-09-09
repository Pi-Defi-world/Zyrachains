import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/get-backend-url';

const SERVER_URL = getBackendUrl();

export async function GET(request: NextRequest) {
  try {
    const qs = request.nextUrl.search;
    const response = await fetch(`${SERVER_URL}/api/community-followers/stats${qs}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(errorData || { error: 'Failed to fetch follower stats' }, {
        status: response.status,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching follower stats:', error);
    return NextResponse.json({ error: 'Failed to fetch follower stats' }, { status: 500 });
  }
}