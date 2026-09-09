"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheKeySegment = cacheKeySegment;
exports.cacheDel = cacheDel;
const redis_1 = require("redis");
const TTL_SECONDS_DEFAULT = 60;
const memoryStore = new Map();
let redis = null;
let redisConnecting = null;
async function getRedis() {
    const url = process.env.REDIS_URL?.trim();
    if (!url)
        return null;
    if (redis)
        return redis;
    if (!redisConnecting) {
        redisConnecting = (async () => {
            try {
                const client = (0, redis_1.createClient)({ url });
                client.on('error', (err) => {
                    console.warn('[redisMemoryCache] Redis client error:', err?.message || err);
                });
                await client.connect();
                redis = client;
                console.log('[redisMemoryCache] Connected to Redis');
                return redis;
            }
            catch (e) {
                console.warn('[redisMemoryCache] Redis unavailable, using memory fallback:', e);
                redisConnecting = null;
                return null;
            }
        })();
    }
    return redisConnecting;
}
async function cacheGet(key) {
    const r = await getRedis();
    if (r) {
        try {
            const v = await r.get(key);
            return v;
        }
        catch {
        }
    }
    const m = memoryStore.get(key);
    if (!m || m.expiresAt < Date.now()) {
        memoryStore.delete(key);
        return null;
    }
    return m.value;
}
async function cacheSet(key, value, ttlSeconds = TTL_SECONDS_DEFAULT) {
    const r = await getRedis();
    if (r) {
        try {
            await r.setEx(key, ttlSeconds, value);
            return;
        }
        catch {
        }
    }
    memoryStore.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
    });
}
function cacheKeySegment(segment) {
    return `Zyrachain:v2:home:${segment}`;
}
async function cacheDel(key) {
    const r = await getRedis();
    if (r) {
        try {
            await r.del(key);
            return;
        }
        catch {
        }
    }
    memoryStore.delete(key);
}
//# sourceMappingURL=redisMemoryCache.js.map