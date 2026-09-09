"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OKXSource = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class OKXSource extends types_1.PriceSource {
    constructor() {
        super(...arguments);
        this.baseUrl = 'https://www.okx.com/api/v5';
    }
    async fetchPrice() {
        const startTime = Date.now();
        try {
            const url = `${this.baseUrl}/market/ticker`;
            logger_1.logger.debug('Fetching price from OKX', { symbol: this.symbol });
            const response = await axios_1.default.get(url, {
                params: {
                    instId: this.symbol,
                },
                timeout: 10000,
            });
            if (!response.data || !response.data.data || !response.data.data[0]) {
                throw new types_1.SourceError('Invalid response from OKX', this.name);
            }
            const ticker = response.data.data[0];
            const price = parseFloat(ticker.last);
            const timestamp = new Date(parseInt(ticker.ts));
            if (!price || isNaN(price)) {
                throw new types_1.SourceError('Invalid price data from OKX', this.name);
            }
            const responseTime = Date.now() - startTime;
            this.recordSuccess(responseTime);
            logger_1.logger.info('OKX price fetched', { price, responseTime });
            return {
                price,
                timestamp,
                source: this.name,
                weight: this.weight,
            };
        }
        catch (error) {
            const errorMessage = error.response?.data?.msg || error.message;
            this.recordError(errorMessage);
            logger_1.logger.error('OKX fetch error', {
                error: errorMessage,
                symbol: this.symbol,
            });
            throw new types_1.SourceError(`OKX error: ${errorMessage}`, this.name);
        }
    }
}
exports.OKXSource = OKXSource;
//# sourceMappingURL=okx.js.map