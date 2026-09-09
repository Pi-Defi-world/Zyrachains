/**
 * In-memory TTL cache shared by /api/social-stats and listing merge logic.
 * Reduces duplicate calls to X / Telegram when many listings share handles or
 * the same page is refreshed within the TTL window.
 */

const cache = new Map<string, { expires: number; body: unknown }>();

export function getSocialStatsCacheTtlMs(): number {
  return parseInt(process.env.SOCIAL_STATS_CACHE_TTL_MS || '600000', 10);
}

export function cachedSocialFetch<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const ttl = getSocialStatsCacheTtlMs();
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return Promise.resolve(hit.body as T);
  }
  return fn().then((body) => {
    cache.set(key, { body, expires: Date.now() + ttl });
    return body;
  });
}
