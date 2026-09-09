"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinanceSource = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class BinanceSource extends types_1.PriceSource {
    constructor() {
        super(...arguments);
        this.baseUrl = 'https://api.binance.com/api/v3';
    }
    async fetchPrice() {
        const startTime = Date.now();
        try {
            const url = `${this.baseUrl}/ticker/price`;
            const response = await axios_1.default.get(url, {
                params: { symbol: this.symbol },
                timeout: 5000,
            });
            const price = parseFloat(response.data?.price);
            if (!price || isNaN(price)) {
                throw new types_1.SourceError('Invalid price data from Binance', this.name);
            }
            const responseTime = Date.now() - startTime;
            this.recordSuccess(responseTime);
            logger_1.logger.info('Binance price fetched', { price, responseTime });
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
            logger_1.logger.error('Binance fetch error', { error: errorMessage, symbol: this.symbol });
            throw new types_1.SourceError(`Binance error: ${errorMessage}`, this.name);
        }
    }
}
exports.BinanceSource = BinanceSource;
//# sourceMappingURL=binance.js.map