export interface CoinGeckoMarketData {
    price_usd: number;
    market_cap_usd: number;
    total_supply: number;
    circulating_supply: number;
    fdv_usd: number;
    last_updated: string;
}
export declare function fetchCoinGeckoMarketData(): Promise<CoinGeckoMarketData>;
//# sourceMappingURL=coinGeckoMarket.d.ts.map