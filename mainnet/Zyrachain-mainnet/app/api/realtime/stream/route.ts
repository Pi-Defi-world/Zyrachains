import { NextResponse } from 'next/server';

// This route exists to prevent 404 errors from cached realtime stream requests
// The realtime functionality has been removed from the ecosystem hub
export async function GET() {
  return NextResponse.json(
    { 
      message: 'Realtime stream has been removed from this ecosystem hub',
      status: 'discontinued',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}

export async function POST() {
  return NextResponse.json(
    { 
      message: 'Realtime stream has been removed from this ecosystem hub',
      status: 'discontinued',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
} 