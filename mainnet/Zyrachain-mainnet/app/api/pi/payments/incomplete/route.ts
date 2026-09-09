import { NextRequest } from 'next/server';
import { fetchBackend, proxyJson } from '@/lib/backend-proxy';

export async function GET(request: NextRequest) {
  try {
    const { status, data } = await fetchBackend('GET', '/api/pi/payments/incomplete');
    return proxyJson(data, status);
  } catch (error) {
    console.error('Error getting incomplete payments:', error);
    return proxyJson(
      {
        error: 'Failed to get incomplete payments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, paymentId, txid } = body;

    let endpoint = '/api/pi/payments/incomplete';
    if (action === 'cancel' && paymentId) {
      endpoint = '/api/pi/payments/cancel';
    } else if (action === 'complete' && paymentId && txid) {
      endpoint = '/api/pi/payments/complete';
    } else if (action !== undefined) {
      return proxyJson({ error: 'Invalid action or missing parameters' }, 400);
    }

    const { status, data } = await fetchBackend('POST', endpoint, { body });
    return proxyJson(data, status);
  } catch (error) {
    console.error('Error handling incomplete payment:', error);
    return proxyJson(
      {
        error: 'Failed to handle incomplete payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
}