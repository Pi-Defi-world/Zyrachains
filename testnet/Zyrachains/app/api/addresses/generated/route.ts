import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/get-backend-url';

const SERVER_URL = getBackendUrl();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Generated addresses route called, SERVER_URL:', SERVER_URL);
    
    const response = await fetch(`${SERVER_URL}/api/ecosystem?type=generated-addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
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
    
    // Additional validation for generated addresses
    if (data.success && data.data) {
      // Filter out invalid addresses
      const validAddresses = data.data.filter((addr: any) => {
        // Check if address has required fields
        if (!addr.identifier || !addr.Name) {
          console.log('🔍 Skipping invalid generated address:', addr);
          return false;
        }
        
        // Check if identifier looks like a valid Stellar address
        if (!addr.identifier.match(/^G[A-Z0-9]{55}$/)) {
          console.log('🔍 Skipping invalid Stellar address format:', addr.identifier);
          return false;
        }
        
        return true;
      });
      
      console.log('🔍 Valid generated addresses:', validAddresses.length);
      return NextResponse.json({ success: true, data: validAddresses });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching generated addresses:', error);
    
    // If it's a timeout or network error, return empty data instead of error
    if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('fetch') || error.name === 'TimeoutError' || error.name === 'AbortError')) {
      console.log('🔍 Network/timeout error, returning empty data');
      return NextResponse.json({ success: true, data: [] });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch generated addresses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
