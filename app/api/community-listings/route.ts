import { NextRequest } from 'next/server';
import { fetchBackend, proxyJson } from '@/lib/backend-proxy';

export async function GET(request: NextRequest) {
  try {
    const qs = request.nextUrl.search;
    const { status, data } = await fetchBackend('GET', `/api/listings/community${qs}`);
    return proxyJson(data, status);
  } catch (error) {
    console.error('Error fetching community listings:', error);
    return proxyJson({ error: 'Failed to fetch community listings' }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { status, data } = await fetchBackend('POST', '/api/listings/community', { body });
    return proxyJson(data, status);
  } catch (error) {
    console.error('Error creating community listing:', error);
    return proxyJson({ error: 'Failed to create community listing' }, 500);
  }
}
