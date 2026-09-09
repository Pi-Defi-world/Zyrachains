export interface PriceObservation {
    price: number;
    timestamp: Date;
    source: string;
}
export declare function recordPrice(price: number, source: string): Promise<void>;
export declare function get24hStats(): Promise<{
    high24h: number;
    low24h: number;
    open24h: number;
    closePrice: number;
} | null>;
export declare function trimOldPrices(): Promise<void>;
//# sourceMappingURL=priceHistory.d.ts.map