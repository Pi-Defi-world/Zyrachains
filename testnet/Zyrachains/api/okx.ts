import axios from 'axios';

const BASE_URL_OKX = 'https://api.zyrachain.org/';
const PRICE_TTL_MS = 30_000; // 30 seconds
const LS_KEY = 'okx_market';

type MarketData = {
  idxPx: string;
  high24h: string;
  open24h: string;
  low24h: string;
};

const api = axios.create({
  baseURL: BASE_URL_OKX,
  headers: {
    'Content-Type': 'application/json',
  },
});

let memoryCache: { data: MarketData; ts: number } | null = null;

function readLocalCache(): { data: MarketData; ts: number } | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.ts !== 'number' || !parsed.data) return null;
    return parsed as { data: MarketData; ts: number };
  } catch {
    return null;
  }
}

function writeLocalCache(entry: { data: MarketData; ts: number }) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LS_KEY, JSON.stringify(entry));
  } catch {
    // ignore storage failures
  }
}

async function fetchFromNetwork(): Promise<MarketData> {
  const response = await api.get(`/data/pi-price`);
  // The API returns { data: [ { idxPx, high24h, open24h, low24h } ] }
  return response.data.data[0] as MarketData;
}

export const okx = {
  getMarketData: async (): Promise<MarketData> => {
    const now = Date.now();

    // 1) Fresh in-memory cache
    if (memoryCache && now - memoryCache.ts < PRICE_TTL_MS) {
      return memoryCache.data;
    }

    // 2) Fresh localStorage cache → return immediately, refresh in background
    const ls = readLocalCache();
    if (ls && now - ls.ts < PRICE_TTL_MS) {
      memoryCache = ls; // sync memory
      // background refresh (non-blocking)
      (async () => {
        try {
          const data = await fetchFromNetwork();
          const entry = { data, ts: Date.now() };
          memoryCache = entry;
          writeLocalCache(entry);
        } catch {
          // ignore background errors
        }
      })();
      return ls.data;
    }

    // 3) Network fetch
    try {
      const data = await fetchFromNetwork();
      const entry = { data, ts: Date.now() };
      memoryCache = entry;
      writeLocalCache(entry);
      return data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      // 4) Fallback to any cached value
      if (memoryCache) return memoryCache.data;
      if (ls) return ls.data;
      // 5) Ultimate default if nothing cached exists yet
      return {
        idxPx: '0',
        high24h: '0',
        open24h: '0',
        low24h: '0',
      };
    }
  }
};
