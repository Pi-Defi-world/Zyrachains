/**
 * CoinGecko market data fetcher for Pi Network
 * Fetches live market_cap, total_supply, circulating_supply, FDV
 */
import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 30, checkperiod: 10 });

export interface CoinGeckoMarketData {
  price_usd: number;
  market_cap_usd: number;
  total_supply: number;
  circulating_supply: number;
  fdv_usd: number;
  last_updated: string;
}

const FALLBACK: CoinGeckoMarketData = {
  price_usd: 0,
  market_cap_usd: 0,
  total_supply: 100_000_000_000,
  circulating_supply: 10_600_000_000,
  fdv_usd: 0,
  last_updated: new Date().toISOString(),
};

export async function fetchCoinGeckoMarketData(): Promise<CoinGeckoMarketData> {
  const cached = cache.get<CoinGeckoMarketData>('coingecko_market');
  if (cached) return cached;

  try {
    const url = 'https://api.coingecko.com/api/v3/coins/pi-network?localization=false&tickers=false&community_data=false&developer_data=false';
    const res = await axios.get(url, { timeout: 8000 });

    const md = res.data?.market_data;
    if (!md?.current_price?.usd) throw new Error('Invalid CoinGecko response');

    const data: CoinGeckoMarketData = {
      price_usd: md.current_price.usd,
      market_cap_usd: md.market_cap?.usd ?? FALLBACK.market_cap_usd,
      total_supply: md.total_supply ?? FALLBACK.total_supply,
      circulating_supply: md.circulating_supply ?? FALLBACK.circulating_supply,
      fdv_usd: md.fully_diluted_valuation?.usd ?? 0,
      last_updated: md.last_updated ?? new Date().toISOString(),
    };

    cache.set('coingecko_market', data);
    return data;
  } catch (e) {
    console.warn('[coinGeckoMarket] Fetch failed, using fallback:', String(e));
    return FALLBACK;
  }
}
