"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitgetSource = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class BitgetSource extends types_1.PriceSource {
    constructor() {
        super(...arguments);
        this.baseUrl = 'https://api.bitget.com/api/v2/mix/market';
    }
    async fetchPrice() {
        const startTime = Date.now();
        try {
            const url = `${this.baseUrl}/symbol-price`;
            logger_1.logger.debug('Fetching price from Bitget', { symbol: this.symbol });
            const response = await axios_1.default.get(url, {
                params: {
                    productType: 'usdt-futures',
                    symbol: this.symbol,
                },
                timeout: 10000,
            });
            if (!response.data || response.data.code !== '00000' || !Array.isArray(response.data.data) || response.data.data.length === 0) {
                throw new types_1.SourceError('Invalid response from Bitget', this.name);
            }
            const price = parseFloat(response.data.data[0].price);
            const timestamp = new Date();
            if (!price || isNaN(price)) {
                throw new types_1.SourceError('Invalid price data from Bitget', this.name);
            }
            const responseTime = Date.now() - startTime;
            this.recordSuccess(responseTime);
            logger_1.logger.info('Bitget price fetched', { price, responseTime });
            return {
                price,
                timestamp,
                source: this.name,
                weight: this.weight,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.recordError(errorMessage);
            logger_1.logger.error('Bitget fetch error', {
                error: errorMessage,
                symbol: this.symbol,
            });
            throw new types_1.SourceError(`Bitget error: ${errorMessage}`, this.name);
        }
    }
}
exports.BitgetSource = BitgetSource;
//# sourceMappingURL=bitget.js.map