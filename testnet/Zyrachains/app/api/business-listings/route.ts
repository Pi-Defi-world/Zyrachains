import { NextRequest } from 'next/server';
import { fetchBackend, proxyJson } from '@/lib/backend-proxy';

export async function GET(request: NextRequest) {
  try {
    const qs = request.nextUrl.search;
    const { status, data } = await fetchBackend('GET', `/api/listings/business${qs}`);
    return proxyJson(data, status);
  } catch (error) {
    console.error('Error fetching business listings:', error);
    return proxyJson({ error: 'Failed to fetch business listings' }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { status, data } = await fetchBackend('POST', '/api/listings/business', { body });
    return proxyJson(data, status);
  } catch (error) {
    console.error('Error creating business listing:', error);
    return proxyJson({ error: 'Failed to create business listing' }, 500);
  }
}
