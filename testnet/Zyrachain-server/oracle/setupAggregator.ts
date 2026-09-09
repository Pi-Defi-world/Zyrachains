import { PriceAggregator } from './services/aggregator';
import { logger } from './utils/logger';
import { MexcSource } from './sources/mexc';

let singleton: PriceAggregator | null = null;

export function getPriceOracleAggregator(): PriceAggregator {
  if (!singleton) {
    singleton = new PriceAggregator();
    // MEXC only — reliable public API, no rate limits at our volume
    // CoinGecko/OKX/Bitget removed due to persistent rate-limits and timeouts
    singleton.addSource(new MexcSource('mexc', 3.0, 'PIUSDT'));
    logger.info('Price oracle initialized (1 source: MEXC)');
  }
  return singleton;
}

/**
 * Direct MEXC 24hr ticker fetch — gives price, change%, high, low, volume in one call.
 * Used by the hero snapshot builder instead of the aggregator.
 */
export async function getMexc24hrTicker() {
  try {
    const res = await fetch('https://api.mexc.com/api/v3/ticker/24hr?symbol=PIUSDT');
    const json = await res.json() as Record<string, unknown>;
    return {
      priceUsd: parseFloat(String(json.lastPrice ?? '0')) || 0,
      high24hUsd: parseFloat(String(json.highPrice ?? '0')) || 0,
      low24hUsd: parseFloat(String(json.lowPrice ?? '0')) || 0,
      open24hUsd: parseFloat(String(json.openPrice ?? '0')) || 0,
      priceChange24h: parseFloat(String(json.priceChangePercent ?? '0')) || 0,
      volume24h: parseFloat(String(json.volume ?? '0')) || 0,
      source: 'mexc',
    };
  } catch {
    return null;
  }
}
