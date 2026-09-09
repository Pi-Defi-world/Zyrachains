"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.horizonBaseUrl = horizonBaseUrl;
exports.getHorizonMainnet = getHorizonMainnet;
const axios_1 = __importDefault(require("axios"));
const DEFAULT_BASE = 'https://api.mainnet.minepi.com';
const DEFAULT_FALLBACK = 'https://api.mainnet.minepi.com';
function horizonBaseUrl() {
    return (process.env.PCT_HORIZON_BASE_URL ||
        process.env.HORIZON_BASE_URL ||
        DEFAULT_BASE).replace(/\/$/, '');
}
function horizonFallbackUrl() {
    return (process.env.HORIZON_FALLBACK_URL ||
        process.env.NEXT_PUBLIC_HORIZON_FALLBACK_URL ||
        DEFAULT_FALLBACK).replace(/\/$/, '');
}
let client = null;
function getHorizonMainnet() {
    if (!client) {
        const fallback = horizonFallbackUrl();
        client = axios_1.default.create({
            baseURL: horizonBaseUrl(),
            timeout: Number(process.env.HORIZON_HTTP_TIMEOUT_MS || 12000),
            headers: { Accept: 'application/json' },
        });
        client.interceptors.response.use((response) => response, async (error) => {
            const cfg = error?.config;
            if (!cfg)
                return Promise.reject(error);
            const status = error?.response?.status;
            if (status === 429 || (status && status >= 500)) {
                const retries = (cfg.__retries || 0) + 1;
                const maxRetries = Number(process.env.HORIZON_MAX_RETRIES ?? 1);
                if (retries > maxRetries)
                    return Promise.reject(error);
                const delay = status === 429
                    ? Number(error.response?.headers?.['retry-after'] || 2) * 1000
                    : Math.min(30000, 1000 * Math.pow(2, retries));
                await new Promise((r) => setTimeout(r, delay));
                return client.request({ ...cfg, __retries: retries });
            }
            const shouldFallback = !cfg.__fallbackTried &&
                fallback &&
                fallback !== cfg.baseURL &&
                typeof status !== 'number';
            if (shouldFallback) {
                return client.request({ ...cfg, baseURL: fallback, __fallbackTried: true });
            }
            return Promise.reject(error);
        });
    }
    return client;
}
//# sourceMappingURL=horizonMainnet.js.map