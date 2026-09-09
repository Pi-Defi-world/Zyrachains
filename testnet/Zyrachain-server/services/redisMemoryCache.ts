/**
 * Redis-backed cache with in-memory fallback when REDIS_URL is unset.
 * Used by /api/v2/home read path for hot snapshot JSON.
 */
import { createClient, type RedisClientType } from 'redis';

const TTL_SECONDS_DEFAULT = 60;
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

let redis: RedisClientType | null = null;
let redisConnecting: Promise<RedisClientType | null> | null = null;

async function getRedis(): Promise<RedisClientType | null> {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;

  if (redis) return redis;

  if (!redisConnecting) {
    redisConnecting = (async () => {
      try {
        const client = createClient({ url });
        client.on('error', (err) => {
          console.warn('[redisMemoryCache] Redis client error:', err?.message || err);
        });
        await client.connect();
        redis = client as RedisClientType;
        console.log('[redisMemoryCache] Connected to Redis');
        return redis;
      } catch (e) {
        console.warn('[redisMemoryCache] Redis unavailable, using memory fallback:', e);
        redisConnecting = null;
        return null;
      }
    })();
  }

  return redisConnecting;
}

export async function cacheGet(key: string): Promise<string | null> {
  const r = await getRedis();
  if (r) {
    try {
      const v = await r.get(key);
      return v;
    } catch {
      /* fall through */
    }
  }
  const m = memoryStore.get(key);
  if (!m || m.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return m.value;
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number = TTL_SECONDS_DEFAULT
): Promise<void> {
  const r = await getRedis();
  if (r) {
    try {
      await r.setEx(key, ttlSeconds, value);
      return;
    } catch {
      /* fall through */
    }
  }
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function cacheKeySegment(segment: string): string {
  return `Zyrachain:v2:home:${segment}`;
}

export async function cacheDel(key: string): Promise<void> {
  const r = await getRedis();
  if (r) {
    try {
      await r.del(key);
      return;
    } catch {
      /* fall through */
    }
  }
  memoryStore.delete(key);
}
