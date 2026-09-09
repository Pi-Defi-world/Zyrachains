export const DEFAULT_LOCAL_URL = 'http://localhost:4111';
export const DEFAULT_REMOTE_URL = 'https://api.zyrachain.org';

const normalize = (url: string): string => {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `http://${trimmed.replace(/^\/+/, '')}`.replace(/\/$/, '');
  }
  return trimmed.replace(/\/$/, '');
};

const firstDefined = (values: Array<string | undefined>): string | undefined => {
  for (const value of values) {
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
};

const shouldPreferLocal = (): boolean => {
  if (process.env.NEXT_PUBLIC_FORCE_REMOTE_BACKEND === 'true' || process.env.FORCE_REMOTE_BACKEND === 'true') {
    return false;
  }
  if (process.env.NEXT_PUBLIC_FORCE_LOCAL_BACKEND === 'true' || process.env.FORCE_LOCAL_BACKEND === 'true') {
    return true;
  }
  // Only use local backend when running on localhost in the browser
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
  }
  // Server-side: only local in development
  return process.env.NODE_ENV === 'development';
};

const BAD_HOSTNAMES = new Set(['server.zyrachains.org']);

const isBadHostname = (url: string): boolean => {
  try {
    const { hostname } = new URL(url);
    return BAD_HOSTNAMES.has(hostname);
  } catch {
    return false;
  }
};

const resolveBackendBase = (): string => {
  const preferLocal = shouldPreferLocal();

  const localCandidate = firstDefined([
    process.env.NEXT_PUBLIC_LOCAL_SERVER_URL,
    process.env.LOCAL_SERVER_URL,
    process.env.NEXT_PUBLIC_API_URL,
  ]);

  const remoteCandidate = firstDefined([
    process.env.NEXT_PUBLIC_SERVER_URL,
    process.env.SERVER_URL,
  ]);

  const local = normalize(localCandidate ?? DEFAULT_LOCAL_URL);
  let remote = normalize(remoteCandidate ?? DEFAULT_REMOTE_URL);

  if (isBadHostname(remote)) {
    console.warn('[getBackendUrl] Rejecting bad hostname, falling back to default:', remote);
    remote = DEFAULT_REMOTE_URL;
  }

  return preferLocal ? local : remote;
};

/**
 * Shared backend URL for both server and client runtimes.
 * Defaults to local API when running in development unless overridden.
 */
export function getBackendUrl(): string {
  return resolveBackendBase();
}

/**
 * Alias retained for readability in browser-facing code.
 */
export const getPublicBackendUrl = getBackendUrl;
