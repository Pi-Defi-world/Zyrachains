import { NextRequest } from 'next/server';
import { fetchBackend, proxyJson } from '@/lib/backend-proxy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return proxyJson({ error: 'Missing required fields' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return proxyJson({ error: 'Invalid email format' }, 400);
    }

    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const { status, data } = await fetchBackend('POST', '/api/contact', {
      body: { ...body, ipAddress, userAgent },
    });

    return proxyJson(data, status);
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return proxyJson({ error: 'Failed to submit contact form' }, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth) {
      return proxyJson({ error: 'Unauthorized' }, 401);
    }

    const qs = request.nextUrl.search;
    const { status, data } = await fetchBackend('GET', `/api/contact${qs}`, { auth });

    return proxyJson(data, status);
  } catch (error) {
    console.error('Error fetching contact inquiries:', error);
    return proxyJson({ error: 'Failed to fetch inquiries' }, 500);
  }
}