"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitfinexSource = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class BitfinexSource extends types_1.PriceSource {
    constructor() {
        super(...arguments);
        this.baseUrl = 'https://api-pub.bitfinex.com/v2';
    }
    async fetchPrice() {
        const startTime = Date.now();
        try {
            const url = `${this.baseUrl}/ticker/${this.symbol}`;
            const response = await axios_1.default.get(url, {
                timeout: 5000,
            });
            if (!response.data || !Array.isArray(response.data) || response.data.length < 8) {
                throw new types_1.SourceError('Invalid response from Bitfinex', this.name);
            }
            const price = parseFloat(response.data[6]);
            if (!price || isNaN(price)) {
                throw new types_1.SourceError('Invalid price data from Bitfinex', this.name);
            }
            const responseTime = Date.now() - startTime;
            this.recordSuccess(responseTime);
            logger_1.logger.info('Bitfinex price fetched', { price, responseTime });
            return {
                price,
                timestamp: new Date(),
                source: this.name,
                weight: this.weight,
            };
        }
        catch (error) {
            const errorMessage = error.response?.data?.error || error.message;
            this.recordError(errorMessage);
            logger_1.logger.error('Bitfinex fetch error', { error: errorMessage, symbol: this.symbol });
            throw new types_1.SourceError(`Bitfinex error: ${errorMessage}`, this.name);
        }
    }
}
exports.BitfinexSource = BitfinexSource;
//# sourceMappingURL=bitfinex.js.map