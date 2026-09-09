import { NextRequest } from 'next/server';
import { fetchBackend, proxyJson } from '@/lib/backend-proxy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return proxyJson({ error: 'Payment ID is required' }, 400);
    }

    const { status, data } = await fetchBackend('POST', '/api/pi/payments/approve', {
      body,
    });

    return proxyJson(data, status);
  } catch (error) {
    console.error('Error approving payment:', error);
    return proxyJson(
      {
        error: 'Failed to approve payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
}