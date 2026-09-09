export declare function cacheGet(key: string): Promise<string | null>;
export declare function cacheSet(key: string, value: string, ttlSeconds?: number): Promise<void>;
export declare function cacheKeySegment(segment: string): string;
export declare function cacheDel(key: string): Promise<void>;
//# sourceMappingURL=redisMemoryCache.d.ts.map