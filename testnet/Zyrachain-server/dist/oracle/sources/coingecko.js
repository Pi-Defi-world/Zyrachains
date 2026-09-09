"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinGeckoSource = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class CoinGeckoSource extends types_1.PriceSource {
    constructor() {
        super(...arguments);
        this.baseUrl = 'https://api.coingecko.com/api/v3';
    }
    async fetchPrice() {
        const startTime = Date.now();
        try {
            const url = `${this.baseUrl}/simple/price?ids=${this.symbol}&vs_currencies=usd&include_last_updated_at=true`;
            logger_1.logger.debug('Fetching price from CoinGecko', { symbol: this.symbol });
            const response = await axios_1.default.get(url, {
                timeout: 10000,
                headers: {
                    Accept: 'application/json',
                },
            });
            const data = response.data[this.symbol];
            if (!data || !data.usd) {
                throw new types_1.SourceError('Invalid response from CoinGecko', this.name);
            }
            const price = data.usd;
            const timestamp = data.last_updated_at
                ? new Date(data.last_updated_at * 1000)
                : new Date();
            const responseTime = Date.now() - startTime;
            this.recordSuccess(responseTime);
            logger_1.logger.info('CoinGecko price fetched', { price, responseTime });
            return {
                price,
                timestamp,
                source: this.name,
                weight: this.weight,
            };
        }
        catch (error) {
            const err = error;
            const errorMessage = err.response?.data?.status?.error_message || err.message || 'Unknown error';
            this.recordError(errorMessage);
            logger_1.logger.error('CoinGecko fetch error', {
                error: errorMessage,
                symbol: this.symbol,
            });
            throw new types_1.SourceError(`CoinGecko error: ${errorMessage}`, this.name);
        }
    }
}
exports.CoinGeckoSource = CoinGeckoSource;
//# sourceMappingURL=coingecko.js.map