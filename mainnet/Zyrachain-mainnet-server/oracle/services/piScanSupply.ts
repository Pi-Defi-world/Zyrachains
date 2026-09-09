/**
 * PiScan supply data fetcher for Pi Network
 * Fetches live mainnet supply, circulating, and locked amounts
 */
import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60, checkperiod: 20 });

export interface PiScanSupply {
  circulating_supply: number;
  total_locked: number;
  total_supply: number;
  updated_at: string;
}

const FALLBACK: PiScanSupply = {
  circulating_supply: 10_600_000_000,
  total_locked: 6_170_000_000,
  total_supply: 100_000_000_000,
  updated_at: new Date().toISOString(),
};

export async function fetchPiScanSupply(): Promise<PiScanSupply> {
  const cached = cache.get<PiScanSupply>('piscan_supply');
  if (cached) return cached;

  try {
    const res = await axios.get('https://api.piscan.io/data/mainnet-supply', { timeout: 8000 });
    const data: PiScanSupply = {
      circulating_supply: res.data.circulating_supply ?? res.data.total_circulating_supply ?? FALLBACK.circulating_supply,
      total_locked: res.data.total_locked ?? FALLBACK.total_locked,
      total_supply: FALLBACK.total_supply,
      updated_at: res.data.updated_at ?? new Date().toISOString(),
    };
    cache.set('piscan_supply', data);
    return data;
  } catch (e) {
    console.warn('[piScanSupply] Fetch failed, using fallback:', String(e));
    return FALLBACK;
  }
}
