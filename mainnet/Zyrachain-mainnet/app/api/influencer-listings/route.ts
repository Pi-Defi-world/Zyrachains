import { NextRequest } from 'next/server';
import { fetchBackend, proxyJson } from '@/lib/backend-proxy';

export async function GET(request: NextRequest) {
  try {
    const qs = request.nextUrl.search;
    const { status, data } = await fetchBackend('GET', `/api/listings/influencer${qs}`);
    return proxyJson(data, status);
  } catch (error) {
    console.error('Error fetching influencer listings:', error);
    return proxyJson({ error: 'Failed to fetch influencer listings' }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { status, data } = await fetchBackend('POST', '/api/listings/influencer', { body });
    return proxyJson(data, status);
  } catch (error) {
    console.error('Error creating influencer listing:', error);
    return proxyJson({ error: 'Failed to create influencer listing' }, 500);
  }
}
