import { NextRequest } from 'next/server';
import { fetchBackend, proxyJson } from '@/lib/backend-proxy';

const LISTING_TYPES = ['business', 'startup', 'community', 'influencer', 'project', 'update'];

interface RouteContext {
  params: Promise<{ type: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { type } = await context.params;
    if (!LISTING_TYPES.includes(type)) {
      return proxyJson({ error: 'Invalid listing type' }, 400);
    }

    const qs = request.nextUrl.search;
    const { status, data } = await fetchBackend('GET', `/api/listings/${type}${qs}`);
    return proxyJson(data, status);
  } catch (error) {
    console.error('Error fetching listings:', error);
    return proxyJson(
      { error: 'Failed to fetch listings' },
      500
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { type } = await context.params;
    if (!LISTING_TYPES.includes(type)) {
      return proxyJson({ error: 'Invalid listing type' }, 400);
    }

    const body = await request.json();
    const { status, data } = await fetchBackend('POST', `/api/listings/${type}`, { body });
    return proxyJson(data, status);
  } catch (error) {
    console.error('Error creating listing:', error);
    return proxyJson(
      { error: 'Failed to create listing' },
      500
    );
  }
}
