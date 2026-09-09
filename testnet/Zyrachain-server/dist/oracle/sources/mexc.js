"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MexcSource = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class MexcSource extends types_1.PriceSource {
    constructor() {
        super(...arguments);
        this.baseUrl = 'https://api.mexc.com/api/v3';
    }
    async fetchPrice() {
        const startTime = Date.now();
        try {
            const url = `${this.baseUrl}/ticker/price`;
            logger_1.logger.debug('Fetching price from MEXC', { symbol: this.symbol });
            const response = await axios_1.default.get(url, {
                params: { symbol: this.symbol },
                timeout: 10000,
            });
            const price = parseFloat(response.data?.price);
            if (!price || isNaN(price)) {
                throw new types_1.SourceError('Invalid price data from MEXC', this.name);
            }
            const responseTime = Date.now() - startTime;
            this.recordSuccess(responseTime);
            logger_1.logger.info('MEXC price fetched', { price, responseTime });
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
            logger_1.logger.error('MEXC fetch error', {
                error: errorMessage,
                symbol: this.symbol,
            });
            throw new types_1.SourceError(`MEXC error: ${errorMessage}`, this.name);
        }
    }
}
exports.MexcSource = MexcSource;
//# sourceMappingURL=mexc.js.map