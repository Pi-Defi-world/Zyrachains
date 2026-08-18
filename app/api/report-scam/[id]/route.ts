import { NextRequest } from 'next/server';
import { fetchBackend, proxyJson } from '@/lib/backend-proxy';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth) {
      return proxyJson({ error: 'Unauthorized' }, 401);
    }

    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    if (!id) {
      return proxyJson({ error: 'Invalid ID format' }, 400);
    }

    const body = await request.json();
    const { status, data } = await fetchBackend('PATCH', `/api/report-scam/${id}`, {
      body,
      auth,
    });

    return proxyJson(data, status);
  } catch (error) {
    console.error('Error updating scam report:', error);
    return proxyJson({ error: 'Failed to update report' }, 500);
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth) {
      return proxyJson({ error: 'Unauthorized' }, 401);
    }

    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    if (!id) {
      return proxyJson({ error: 'Invalid ID format' }, 400);
    }

    const { status, data } = await fetchBackend('GET', `/api/report-scam/${id}`, { auth });

    return proxyJson(data, status);
  } catch (error) {
    console.error('Error fetching scam report:', error);
    return proxyJson({ error: 'Failed to fetch report' }, 500);
  }
}