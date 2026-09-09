import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, DEFAULT_REMOTE_URL } from '@/lib/get-backend-url';

export const dynamic = 'force-dynamic';

async function fetchWithFallback(url: string, fallbackUrl: string) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    return res;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('fetch failed')) {
      const cause = err.cause as { code?: string } | undefined;
      if (cause?.code === 'ENOTFOUND' || cause?.code === 'ENETUNREACH') {
        try {
          return await fetch(fallbackUrl, { cache: 'no-store' });
        } catch {
          throw err;
        }
      }
    }
    throw err;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ segment: string }> }
) {
  const { segment } = await context.params;
  const base = getBackendUrl();
  const fallbackBase = DEFAULT_REMOTE_URL;
  const fresh = request.nextUrl.searchParams.get('fresh');
  const buildUrl = (b: string) =>
    fresh
      ? `${b}/api/v2/home/${encodeURIComponent(segment)}?fresh=1&_t=${Date.now()}`
      : `${b}/api/v2/home/${encodeURIComponent(segment)}`;

  let upstream: Response;
  try {
    upstream = await fetchWithFallback(buildUrl(base), buildUrl(fallbackBase));
  } catch (err) {
    console.error('[v2/home] Upstream fetch failed:', err);
    return NextResponse.json(
      { error: 'Upstream service unavailable', segment },
      { status: 502 }
    );
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
      'Cache-Control': fresh ? 'no-store' : (upstream.headers.get('Cache-Control') || 'public, max-age=10'),
    },
  });
}
