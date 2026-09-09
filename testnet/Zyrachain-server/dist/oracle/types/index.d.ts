export interface PriceData {
    price: number;
    timestamp: Date;
    source: string;
    weight?: number;
}
export interface AggregatedPrice {
    symbol: string;
    price_usd: number;
    timestamp: Date;
    sources_used: number;
    total_sources: number;
    aggregation_method: string;
    source_prices: Record<string, SourcePriceDetail>;
    confidence_score: number;
    cache_hit: boolean;
}
export interface SourcePriceDetail {
    price: number;
    weight: number;
    timestamp: Date;
}
export interface SourceStatus {
    name: string;
    status: 'active' | 'error' | 'disabled';
    last_success: Date | null;
    last_error: string | null;
    success_rate: number;
    avg_response_time_ms: number;
}
export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    timestamp: Date;
}
export interface SourceConfig {
    name: string;
    enabled: boolean;
    weight: number;
    symbol: string;
    apiKey?: string;
    apiSecret?: string;
}
export declare abstract class PriceSource {
    protected name: string;
    protected weight: number;
    protected symbol: string;
    protected lastSuccess: Date | null;
    protected lastError: string | null;
    protected successCount: number;
    protected errorCount: number;
    protected responseTimes: number[];
    constructor(name: string, weight: number, symbol: string);
    abstract fetchPrice(): Promise<PriceData>;
    getName(): string;
    getWeight(): number;
    getStatus(): SourceStatus;
    protected recordSuccess(responseTime: number): void;
    protected recordError(error: string): void;
}
export declare class PriceOracleError extends Error {
    source?: string | undefined;
    constructor(message: string, source?: string | undefined);
}
export declare class SourceError extends Error {
    source: string;
    constructor(message: string, source: string);
}
//# sourceMappingURL=index.d.ts.map