"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KuCoinSource = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class KuCoinSource extends types_1.PriceSource {
    constructor() {
        super(...arguments);
        this.baseUrl = 'https://api.kucoin.com/api/v1';
    }
    async fetchPrice() {
        const startTime = Date.now();
        try {
            const url = `${this.baseUrl}/market/orderbook/level1`;
            const response = await axios_1.default.get(url, {
                params: { symbol: this.symbol },
                timeout: 5000,
            });
            if (!response.data || response.data.code !== '200000' || !response.data.data) {
                throw new types_1.SourceError('Invalid response from KuCoin', this.name);
            }
            const price = parseFloat(response.data.data.price);
            if (!price || isNaN(price)) {
                throw new types_1.SourceError('Invalid price data from KuCoin', this.name);
            }
            const responseTime = Date.now() - startTime;
            this.recordSuccess(responseTime);
            logger_1.logger.info('KuCoin price fetched', { price, responseTime });
            return {
                price,
                timestamp: new Date(),
                source: this.name,
                weight: this.weight,
            };
        }
        catch (error) {
            const errorMessage = error.response?.data?.msg || error.message;
            this.recordError(errorMessage);
            logger_1.logger.error('KuCoin fetch error', { error: errorMessage, symbol: this.symbol });
            throw new types_1.SourceError(`KuCoin error: ${errorMessage}`, this.name);
        }
    }
}
exports.KuCoinSource = KuCoinSource;
//# sourceMappingURL=kucoin.js.map