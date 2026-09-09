type CounterKey = 'pctScan.runs' | 'pctScan.walletsProcessed' | 'pctScan.walletsFailed' | 'pctScan.horizon429' | 'pctScan.durationMs' | 'v2Home.cacheHit' | 'v2Home.cacheMiss' | 'v2Home.builtOnRequest' | 'v2Home.durationMs';
export declare function inc(key: CounterKey, by?: number): void;
export declare function setGauge(key: CounterKey, value: number): void;
export declare function time<T>(key: CounterKey, fn: () => Promise<T>): Promise<T>;
export declare function getMetricsSnapshot(): Record<string, number>;
export {};
//# sourceMappingURL=metrics.d.ts.map