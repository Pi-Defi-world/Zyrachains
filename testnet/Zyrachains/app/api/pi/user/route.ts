import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/get-backend-url';

const SERVER_URL = getBackendUrl();

export async function GET(_request: NextRequest) {
  try {
    const response = await fetch(`${SERVER_URL}/api/pi/user`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Pi user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch Pi user' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const _piUserData = body; // Prefix with underscore since it's unused

    const response = await fetch(`${SERVER_URL}/api/pi/user`, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers.get('content-type') || 'application/json',
      },
      body: body || undefined,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating Pi user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update Pi user' },
      { status: 500 }
    );
  }
} 
