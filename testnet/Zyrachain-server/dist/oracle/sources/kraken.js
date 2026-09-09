"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KrakenSource = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class KrakenSource extends types_1.PriceSource {
    constructor() {
        super(...arguments);
        this.baseUrl = 'https://api.kraken.com/0/public';
    }
    async fetchPrice() {
        const startTime = Date.now();
        try {
            const url = `${this.baseUrl}/Ticker`;
            const response = await axios_1.default.get(url, {
                params: { pair: this.symbol },
                timeout: 5000,
            });
            const pairData = response.data?.result?.[this.symbol];
            if (!pairData || !pairData.c || !pairData.c[0]) {
                throw new types_1.SourceError('Invalid response from Kraken', this.name);
            }
            const price = parseFloat(pairData.c[0]);
            if (!price || isNaN(price)) {
                throw new types_1.SourceError('Invalid price data from Kraken', this.name);
            }
            const responseTime = Date.now() - startTime;
            this.recordSuccess(responseTime);
            logger_1.logger.info('Kraken price fetched', { price, responseTime });
            return {
                price,
                timestamp: new Date(),
                source: this.name,
                weight: this.weight,
            };
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.[0] || error.message;
            this.recordError(errorMessage);
            logger_1.logger.error('Kraken fetch error', { error: errorMessage, symbol: this.symbol });
            throw new types_1.SourceError(`Kraken error: ${errorMessage}`, this.name);
        }
    }
}
exports.KrakenSource = KrakenSource;
//# sourceMappingURL=kraken.js.map