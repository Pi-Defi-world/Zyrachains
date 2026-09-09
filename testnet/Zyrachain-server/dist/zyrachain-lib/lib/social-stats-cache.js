"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocialStatsCacheTtlMs = getSocialStatsCacheTtlMs;
exports.cachedSocialFetch = cachedSocialFetch;
const cache = new Map();
function getSocialStatsCacheTtlMs() {
    return parseInt(process.env.SOCIAL_STATS_CACHE_TTL_MS || '600000', 10);
}
function cachedSocialFetch(key, fn) {
    const ttl = getSocialStatsCacheTtlMs();
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) {
        return Promise.resolve(hit.body);
    }
    return fn().then((body) => {
        cache.set(key, { body, expires: Date.now() + ttl });
        return body;
    });
}
//# sourceMappingURL=social-stats-cache.js.map