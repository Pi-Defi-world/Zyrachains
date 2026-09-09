import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/get-backend-url';

const SERVER_URL = getBackendUrl();

export async function GET() {
  try {
    const response = await fetch(`${SERVER_URL}/api/addresses/distribution`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        errorData || { success: false, error: 'Failed to fetch address distribution' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching address distribution:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch address distribution' },
      { status: 500 }
    );
  }
}