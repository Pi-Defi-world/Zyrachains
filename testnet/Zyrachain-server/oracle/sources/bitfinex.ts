import axios from 'axios';
import { PriceSource, PriceData, SourceError } from '../types';
import { logger } from '../utils/logger';

export class BitfinexSource extends PriceSource {
  private baseUrl = 'https://api-pub.bitfinex.com/v2';

  async fetchPrice(): Promise<PriceData> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}/ticker/${this.symbol}`;
      const response = await axios.get(url, {
        timeout: 5000,
      });

      if (!response.data || !Array.isArray(response.data) || response.data.length < 8) {
        throw new SourceError('Invalid response from Bitfinex', this.name);
      }

      const price = parseFloat(response.data[6]);

      if (!price || isNaN(price)) {
        throw new SourceError('Invalid price data from Bitfinex', this.name);
      }

      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);

      logger.info('Bitfinex price fetched', { price, responseTime });

      return {
        price,
        timestamp: new Date(),
        source: this.name,
        weight: this.weight,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message;
      this.recordError(errorMessage);
      logger.error('Bitfinex fetch error', { error: errorMessage, symbol: this.symbol });
      throw new SourceError(`Bitfinex error: ${errorMessage}`, this.name);
    }
  }
}
