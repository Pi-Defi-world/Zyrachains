"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCoinGeckoMarketData = fetchCoinGeckoMarketData;
const axios_1 = __importDefault(require("axios"));
const node_cache_1 = __importDefault(require("node-cache"));
const cache = new node_cache_1.default({ stdTTL: 30, checkperiod: 10 });
const FALLBACK = {
    price_usd: 0,
    market_cap_usd: 0,
    total_supply: 100000000000,
    circulating_supply: 10600000000,
    fdv_usd: 0,
    last_updated: new Date().toISOString(),
};
async function fetchCoinGeckoMarketData() {
    const cached = cache.get('coingecko_market');
    if (cached)
        return cached;
    try {
        const url = 'https://api.coingecko.com/api/v3/coins/pi-network?localization=false&tickers=false&community_data=false&developer_data=false';
        const res = await axios_1.default.get(url, { timeout: 8000 });
        const md = res.data?.market_data;
        if (!md?.current_price?.usd)
            throw new Error('Invalid CoinGecko response');
        const data = {
            price_usd: md.current_price.usd,
            market_cap_usd: md.market_cap?.usd ?? FALLBACK.market_cap_usd,
            total_supply: md.total_supply ?? FALLBACK.total_supply,
            circulating_supply: md.circulating_supply ?? FALLBACK.circulating_supply,
            fdv_usd: md.fully_diluted_valuation?.usd ?? 0,
            last_updated: md.last_updated ?? new Date().toISOString(),
        };
        cache.set('coingecko_market', data);
        return data;
    }
    catch (e) {
        console.warn('[coinGeckoMarket] Fetch failed, using fallback:', String(e));
        return FALLBACK;
    }
}
//# sourceMappingURL=coinGeckoMarket.js.map