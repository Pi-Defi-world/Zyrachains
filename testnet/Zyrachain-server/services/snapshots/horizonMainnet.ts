import axios, { AxiosInstance } from 'axios';

const DEFAULT_BASE = 'http://docker-horizon-mainnet-1:8000';
const DEFAULT_FALLBACK = 'https://horizon.suban.org/horizon';

export function horizonBaseUrl(): string {
  return (
    process.env.PCT_HORIZON_BASE_URL ||
    process.env.HORIZON_BASE_URL ||
    DEFAULT_BASE
  ).replace(/\/$/, '');
}

function horizonFallbackUrl(): string {
  return (
    process.env.HORIZON_FALLBACK_URL ||
    process.env.NEXT_PUBLIC_HORIZON_FALLBACK_URL ||
    DEFAULT_FALLBACK
  ).replace(/\/$/, '');
}

let client: AxiosInstance | null = null;

export function getHorizonMainnet(): AxiosInstance {
  if (!client) {
    const fallback = horizonFallbackUrl();
    client = axios.create({
      baseURL: horizonBaseUrl(),
      timeout: Number(process.env.HORIZON_HTTP_TIMEOUT_MS || 12000),
      headers: { Accept: 'application/json' },
    });
    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const cfg = error?.config;
        if (!cfg) return Promise.reject(error);
        const status = error?.response?.status;

        // 429 / 5xx: exponential backoff retry
        if (status === 429 || (status && status >= 500)) {
          const retries = (cfg.__retries || 0) + 1;
          const maxRetries = Number(process.env.HORIZON_MAX_RETRIES ?? 1);
          if (retries > maxRetries) return Promise.reject(error);
          const delay =
            status === 429
              ? Number(error.response?.headers?.['retry-after'] || 2) * 1000
              : Math.min(30000, 1000 * Math.pow(2, retries));
          await new Promise((r) => setTimeout(r, delay));
          return client!.request({ ...cfg, __retries: retries });
        }

        // network errors: fallback to alternate URL if different
        const shouldFallback =
          !cfg.__fallbackTried &&
          fallback &&
          fallback !== cfg.baseURL &&
          typeof status !== 'number';
        if (shouldFallback) {
          return client!.request({ ...cfg, baseURL: fallback, __fallbackTried: true });
        }
        return Promise.reject(error);
      }
    );
  }
  return client;
}
