import { NextRequest } from 'next/server';
import { fetchBackend, proxyJson } from '@/lib/backend-proxy';

const LISTING_TYPES = ['business', 'startup', 'community', 'influencer', 'project'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type && LISTING_TYPES.includes(type)) {
      const { status, data } = await fetchBackend('GET', `/api/listings/${type}`);
      const listings = data.listings ?? data.projects ?? [];
      return proxyJson({ success: true, data: listings }, status);
    }

    // Legacy: no type specified — aggregate all listings
    const { status, data } = await fetchBackend('GET', '/api/listings/all');
    const l = data.listings || {};
    return proxyJson({
      success: true,
      business: l.business || [],
      startup: l.startup || [],
      project: [],
      influencer: l.influencer || [],
    }, status);
  } catch (error) {
    console.error('Error fetching listings data:', error);
    return proxyJson(
      {
        success: false,
        error: 'Failed to fetch listings data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body.type;

    if (!type || !LISTING_TYPES.includes(type)) {
      return proxyJson({ success: false, error: 'Invalid listing type specified' }, 400);
    }

    const { type: _type, ...listingData } = body;
    const { status, data } = await fetchBackend('POST', `/api/listings/${type}`, {
      body: listingData,
    });

    const listing = data.listing ?? data.project ?? data.listing;
    return proxyJson({ success: true, data: { id: listing?._id, ...body } }, status || 201);
  } catch (error) {
    console.error('Error creating listing:', error);
    return proxyJson(
      {
        success: false,
        error: 'Failed to create listing',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
}
