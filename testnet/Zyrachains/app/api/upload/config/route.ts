import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/get-backend-url';

const SERVER_URL = getBackendUrl();

export async function GET(_request: NextRequest) {
  try {
    const response = await fetch(`${SERVER_URL}/api/upload/config`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching upload config:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch upload config' },
      { status: 500 }
    );
  }
} 
