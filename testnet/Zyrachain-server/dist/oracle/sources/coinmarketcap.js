"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinMarketCapSource = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class CoinMarketCapSource extends types_1.PriceSource {
    constructor() {
        super(...arguments);
        this.baseUrl = 'https://pro-api.coinmarketcap.com/v1';
    }
    async fetchPrice() {
        const startTime = Date.now();
        const apiKey = process.env.COINMARKETCAP_API_KEY;
        try {
            let price;
            if (apiKey) {
                const url = `${this.baseUrl}/cryptocurrency/quotes/latest`;
                const response = await axios_1.default.get(url, {
                    params: { id: this.symbol, convert: 'USD' },
                    headers: { 'X-CMC_PRO_API_KEY': apiKey, 'Accept': 'application/json' },
                    timeout: 5000,
                });
                const quote = response.data?.data?.[this.symbol]?.quote?.USD;
                if (!quote || typeof quote.price !== 'number') {
                    throw new types_1.SourceError('Invalid response from CoinMarketCap', this.name);
                }
                price = quote.price;
            }
            else {
                const url = 'https://web-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
                const response = await axios_1.default.get(url, {
                    params: { id: this.symbol, convert: 'USD' },
                    headers: { 'Accept': 'application/json' },
                    timeout: 5000,
                });
                const quote = response.data?.data?.[this.symbol]?.quote?.USD;
                if (!quote || typeof quote.price !== 'number') {
                    throw new types_1.SourceError('Invalid response from CoinMarketCap (free)', this.name);
                }
                price = quote.price;
            }
            if (!price || isNaN(price)) {
                throw new types_1.SourceError('Invalid price data from CoinMarketCap', this.name);
            }
            const responseTime = Date.now() - startTime;
            this.recordSuccess(responseTime);
            logger_1.logger.info('CoinMarketCap price fetched', { price, responseTime });
            return {
                price,
                timestamp: new Date(),
                source: this.name,
                weight: this.weight,
            };
        }
        catch (error) {
            const errorMessage = error.response?.data?.status?.error_message || error.message;
            this.recordError(errorMessage);
            logger_1.logger.error('CoinMarketCap fetch error', { error: errorMessage, symbol: this.symbol });
            throw new types_1.SourceError(`CoinMarketCap error: ${errorMessage}`, this.name);
        }
    }
}
exports.CoinMarketCapSource = CoinMarketCapSource;
//# sourceMappingURL=coinmarketcap.js.map