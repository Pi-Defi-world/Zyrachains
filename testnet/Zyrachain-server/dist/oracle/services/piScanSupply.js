"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPiScanSupply = fetchPiScanSupply;
const axios_1 = __importDefault(require("axios"));
const node_cache_1 = __importDefault(require("node-cache"));
const cache = new node_cache_1.default({ stdTTL: 60, checkperiod: 20 });
const FALLBACK = {
    circulating_supply: 10600000000,
    total_locked: 6170000000,
    total_supply: 100000000000,
    updated_at: new Date().toISOString(),
};
async function fetchPiScanSupply() {
    const cached = cache.get('piscan_supply');
    if (cached)
        return cached;
    try {
        const res = await axios_1.default.get('https://api.piscan.io/data/mainnet-supply', { timeout: 8000 });
        const data = {
            circulating_supply: res.data.circulating_supply ?? res.data.total_circulating_supply ?? FALLBACK.circulating_supply,
            total_locked: res.data.total_locked ?? FALLBACK.total_locked,
            total_supply: FALLBACK.total_supply,
            updated_at: res.data.updated_at ?? new Date().toISOString(),
        };
        cache.set('piscan_supply', data);
        return data;
    }
    catch (e) {
        console.warn('[piScanSupply] Fetch failed, using fallback:', String(e));
        return FALLBACK;
    }
}
//# sourceMappingURL=piScanSupply.js.map