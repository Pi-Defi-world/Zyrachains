import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/get-backend-url';

export async function POST(req: NextRequest) {
  try {
    const response = await fetch(`${getBackendUrl()}/api/pi/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: await req.text(),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Pi auth:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch Pi auth' },
      { status: 500 }
    );
  }
} 