import { NextRequest } from 'next/server';
import { fetchBackend, proxyJson } from '@/lib/backend-proxy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, txid } = body;

    if (!paymentId || !txid) {
      return proxyJson(
        { error: 'Payment ID and transaction ID are required' },
        400
      );
    }

    // Backend completes the payment and saves the listing as status 'pending'
    // (lands in the admin moderation queue instead of being instantly approved).
    const { status, data } = await fetchBackend('POST', '/api/pi/payments/complete', {
      body,
    });

    return proxyJson(data, status);
  } catch (error) {
    console.error('Error completing payment:', error);
    return proxyJson(
      {
        error: 'Failed to complete payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
}