import axios from 'axios';
import { PriceSource, PriceData, SourceError } from '../types';
import { logger } from '../utils/logger';

export class BinanceSource extends PriceSource {
  private baseUrl = 'https://api.binance.com/api/v3';

  async fetchPrice(): Promise<PriceData> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}/ticker/price`;
      const response = await axios.get(url, {
        params: { symbol: this.symbol },
        timeout: 5000,
      });

      const price = parseFloat(response.data?.price);

      if (!price || isNaN(price)) {
        throw new SourceError('Invalid price data from Binance', this.name);
      }

      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);

      logger.info('Binance price fetched', { price, responseTime });

      return {
        price,
        timestamp: new Date(),
        source: this.name,
        weight: this.weight,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.msg || error.message;
      this.recordError(errorMessage);
      logger.error('Binance fetch error', { error: errorMessage, symbol: this.symbol });
      throw new SourceError(`Binance error: ${errorMessage}`, this.name);
    }
  }
}
