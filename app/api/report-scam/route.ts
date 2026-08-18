import { NextRequest } from 'next/server';
import { fetchBackend, proxyJson } from '@/lib/backend-proxy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, scamType } = body;

    if (!description || !scamType) {
      return proxyJson(
        { error: 'Missing required fields: description and scamType are required' },
        400
      );
    }

    const validScamTypes = [
      'fake_project',
      'phishing',
      'suspicious_wallet',
      'fake_giveaway',
      'impersonation',
      'other',
    ];

    if (!validScamTypes.includes(scamType)) {
      return proxyJson({ error: 'Invalid scam type' }, 400);
    }

    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const { status, data } = await fetchBackend('POST', '/api/report-scam', {
      body: { ...body, ipAddress, userAgent },
    });

    return proxyJson(data, status);
  } catch (error) {
    console.error('Error submitting scam report:', error);
    return proxyJson({ error: 'Failed to submit scam report' }, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth) {
      return proxyJson({ error: 'Unauthorized' }, 401);
    }

    const qs = request.nextUrl.search;
    const { status, data } = await fetchBackend('GET', `/api/report-scam${qs}`, { auth });

    return proxyJson(data, status);
  } catch (error) {
    console.error('Error fetching scam reports:', error);
    return proxyJson({ error: 'Failed to fetch reports' }, 500);
  }
}