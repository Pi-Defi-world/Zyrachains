import NodeCache from 'node-cache';
declare class CacheService {
    private cache;
    constructor();
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T, ttl?: number): boolean;
    delete(key: string): number;
    flush(): void;
    getStats(): NodeCache.Stats;
}
export declare const cacheService: CacheService;
export {};
//# sourceMappingURL=cache.d.ts.map