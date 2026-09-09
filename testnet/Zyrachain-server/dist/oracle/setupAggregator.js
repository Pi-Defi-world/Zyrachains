"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPriceOracleAggregator = getPriceOracleAggregator;
exports.getMexc24hrTicker = getMexc24hrTicker;
const aggregator_1 = require("./services/aggregator");
const logger_1 = require("./utils/logger");
const mexc_1 = require("./sources/mexc");
let singleton = null;
function getPriceOracleAggregator() {
    if (!singleton) {
        singleton = new aggregator_1.PriceAggregator();
        singleton.addSource(new mexc_1.MexcSource('mexc', 3.0, 'PIUSDT'));
        logger_1.logger.info('Price oracle initialized (1 source: MEXC)');
    }
    return singleton;
}
async function getMexc24hrTicker() {
    try {
        const res = await fetch('https://api.mexc.com/api/v3/ticker/24hr?symbol=PIUSDT');
        const json = await res.json();
        return {
            priceUsd: parseFloat(String(json.lastPrice ?? '0')) || 0,
            high24hUsd: parseFloat(String(json.highPrice ?? '0')) || 0,
            low24hUsd: parseFloat(String(json.lowPrice ?? '0')) || 0,
            open24hUsd: parseFloat(String(json.openPrice ?? '0')) || 0,
            priceChange24h: parseFloat(String(json.priceChangePercent ?? '0')) || 0,
            volume24h: parseFloat(String(json.volume ?? '0')) || 0,
            source: 'mexc',
        };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=setupAggregator.js.map