import { NextRequest } from 'next/server';
import { fetchBackend, proxyJson } from '@/lib/backend-proxy';

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return proxyJson({ success: false, error: 'Authentication is required' }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return proxyJson({ success: false, error: 'The gift claim request is invalid' }, 400);
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    Array.isArray(body) ||
    Object.keys(body).length !== 1 ||
    !Object.prototype.hasOwnProperty.call(body, 'giftId') ||
    typeof (body as { giftId?: unknown }).giftId !== 'string'
  ) {
    return proxyJson({ success: false, error: 'Only giftId is accepted' }, 400);
  }

  try {
    const { status, data } = await fetchBackend('POST', '/api/pi/payments/claim', {
      auth,
      body: { giftId: (body as { giftId: string }).giftId },
    });
    return proxyJson(data, status);
  } catch {
    return proxyJson({ success: false, error: 'The gift claim service is unavailable' }, 502);
  }
}
