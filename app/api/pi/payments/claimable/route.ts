import { NextRequest } from 'next/server';
import { fetchBackend, proxyJson } from '@/lib/backend-proxy';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return proxyJson({ success: false, error: 'Authentication is required' }, 401);
  }

  try {
    const { status, data } = await fetchBackend('GET', '/api/pi/payments/claimable', { auth });
    return proxyJson(data, status);
  } catch {
    return proxyJson({ success: false, error: 'The gift catalog is unavailable' }, 502);
  }
}
