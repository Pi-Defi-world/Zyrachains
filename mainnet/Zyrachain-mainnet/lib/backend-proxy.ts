import { NextResponse } from 'next/server';
import { getBackendUrl } from './get-backend-url';

const SERVER_URL = getBackendUrl();

export interface ProxyResult<T = any> {
  status: number;
  data: T;
}

export async function fetchBackend(
  method: string,
  path: string,
  opts: { body?: unknown; auth?: string | null } = {}
): Promise<ProxyResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.auth) headers.Authorization = opts.auth;

  const res = await fetch(`${SERVER_URL}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  return { status: res.status, data };
}

export function proxyJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}