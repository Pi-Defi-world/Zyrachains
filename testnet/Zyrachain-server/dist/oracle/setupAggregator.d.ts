import { PriceAggregator } from './services/aggregator';
export declare function getPriceOracleAggregator(): PriceAggregator;
export declare function getMexc24hrTicker(): Promise<{
    priceUsd: number;
    high24hUsd: number;
    low24hUsd: number;
    open24hUsd: number;
    priceChange24h: number;
    volume24h: number;
    source: string;
} | null>;
//# sourceMappingURL=setupAggregator.d.ts.map