import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/get-backend-url';

const SERVER_URL = getBackendUrl();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Core-team addresses route called, SERVER_URL:', SERVER_URL);
    
    const response = await fetch(`${SERVER_URL}/api/ecosystem?type=core-team-addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout protection
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    console.log('🔍 Server response status:', response.status);

    if (!response.ok) {
      // If server returns 404, return empty data instead of error
      if (response.status === 404) {
        console.log('🔍 Server returned 404, returning empty data');
        return NextResponse.json({ success: true, data: [] });
      }
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('🔍 Server response data:', data);
    return NextResponse.json({ success: true, data: data.data || [] });
  } catch (error) {
    console.error('Error fetching core-team addresses:', error);
    
    // If it's a timeout or network error, return empty data instead of error
    if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('fetch'))) {
      console.log('🔍 Network/timeout error, returning empty data');
      return NextResponse.json({ success: true, data: [] });
    }
    
    return NextResponse.json({ success: true, data: [] });
  }
}
