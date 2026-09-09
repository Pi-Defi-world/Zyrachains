/**
 * Pi Price Oracle configuration (embedded in Zyrachain server)
 */
export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.ORACLE_LOG_LEVEL || process.env.LOG_LEVEL || 'info',
  cacheTTL: parseInt(process.env.CACHE_TTL_SECONDS || '30', 10),
  symbols: {
    coingecko: process.env.PI_SYMBOL_COINGECKO || 'pi-network',
    okx: process.env.PI_SYMBOL_OKX || 'PI-USDT',
    bitget: process.env.PI_SYMBOL_BITGET || 'PIUSDT',
    mexc: process.env.PI_SYMBOL_MEXC || 'PIUSDT',
  },
  outlierThresholdPercent: parseInt(process.env.OUTLIER_THRESHOLD_PERCENT || '10', 10),
  minSourcesRequired: parseInt(process.env.MIN_SOURCES_REQUIRED || '1', 10),
  weights: {
    coingecko: parseFloat(process.env.WEIGHT_COINGECKO || '1.5'),
    okx: parseFloat(process.env.WEIGHT_OKX || '2.0'),
    bitget: parseFloat(process.env.WEIGHT_BITGET || '2.0'),
    mexc: parseFloat(process.env.WEIGHT_MEXC || '3.0'),
  },
};

export const oracleConfig = config;

