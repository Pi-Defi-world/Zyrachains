"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinbaseSource = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class CoinbaseSource extends types_1.PriceSource {
    constructor() {
        super(...arguments);
        this.baseUrl = 'https://api.coinbase.com/v2';
    }
    async fetchPrice() {
        const startTime = Date.now();
        try {
            const url = `${this.baseUrl}/prices/${this.symbol}/spot`;
            const response = await axios_1.default.get(url, {
                timeout: 5000,
            });
            const price = parseFloat(response.data?.data?.amount);
            if (!price || isNaN(price)) {
                throw new types_1.SourceError('Invalid price data from Coinbase', this.name);
            }
            const responseTime = Date.now() - startTime;
            this.recordSuccess(responseTime);
            logger_1.logger.info('Coinbase price fetched', { price, responseTime });
            return {
                price,
                timestamp: new Date(),
                source: this.name,
                weight: this.weight,
            };
        }
        catch (error) {
            const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
            this.recordError(errorMessage);
            logger_1.logger.error('Coinbase fetch error', { error: errorMessage, symbol: this.symbol });
            throw new types_1.SourceError(`Coinbase error: ${errorMessage}`, this.name);
        }
    }
}
exports.CoinbaseSource = CoinbaseSource;
//# sourceMappingURL=coinbase.js.map