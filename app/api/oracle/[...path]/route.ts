import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/get-backend-url';

// Same-origin proxy for all /api/oracle/* calls (key management, price data,
// health checks, Horizon proxy). The browser only ever talks to this Next.js
// host, so there are no CORS or build-time-URL issues in production.
const SERVER_URL = getBackendUrl();

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

const FORWARD_HEADERS = ['authorization', 'x-api-key'];

async function proxy(request: NextRequest, context: RouteContext) {
  try {
    const { path } = await context.params;
    const suffix = path.join('/');
    const search = request.nextUrl.search;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    // Forward auth so the backend can authenticate Pi users / API keys.
    for (const name of FORWARD_HEADERS) {
      const value = request.headers.get(name);
      if (value) headers[name.toLowerCase() === 'authorization' ? 'Authorization' : 'X-API-Key'] = value;
    }

    // Read body as text and pass it through verbatim (JSON requests). GET/HEAD
    // requests never carry a body — passing one throws "Request with GET/HEAD
    // method cannot have body.".
    const wantsJson = request.headers.get('content-type')?.includes('application/json');
    const rawBody =
      wantsJson && request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.text()
        : undefined;
    const body = rawBody && rawBody.length > 0 ? rawBody : undefined;

    const res = await fetch(`${SERVER_URL}/api/oracle/${suffix}${search}`, {
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
    console.error('Oracle proxy error:', error);
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