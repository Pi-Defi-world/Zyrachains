import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/get-backend-url';

// Same-origin proxy for all /api/social/* calls (posts, users, tokens, ads,
// referrals, moderation, gamification). The browser only ever talks to this
// Next.js host, so there are no CORS or build-time-URL issues in production.
const SERVER_URL = getBackendUrl();

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

async function proxy(request: NextRequest, context: RouteContext) {
  try {
    const { path } = await context.params;
    const suffix = path.join('/');
    const search = request.nextUrl.search;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    // Forward the Pi access token so the backend can authenticate the user.
    const auth = request.headers.get('authorization');
    if (auth) headers['Authorization'] = auth;

    // Read body as text and pass it through verbatim (JSON requests).
    const body = request.headers.get('content-type')?.includes('application/json')
      ? await request.text()
      : undefined;

    const res = await fetch(`${SERVER_URL}/api/social/${suffix}${search}`, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Social proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Backend request failed' },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}