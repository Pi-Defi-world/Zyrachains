import axios from 'axios';
import { PriceSource, PriceData, SourceError } from '../types';
import { logger } from '../utils/logger';

export class CoinbaseSource extends PriceSource {
  private baseUrl = 'https://api.coinbase.com/v2';

  async fetchPrice(): Promise<PriceData> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}/prices/${this.symbol}/spot`;
      const response = await axios.get(url, {
        timeout: 5000,
      });

      const price = parseFloat(response.data?.data?.amount);

      if (!price || isNaN(price)) {
        throw new SourceError('Invalid price data from Coinbase', this.name);
      }

      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);

      logger.info('Coinbase price fetched', { price, responseTime });

      return {
        price,
        timestamp: new Date(),
        source: this.name,
        weight: this.weight,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
      this.recordError(errorMessage);
      logger.error('Coinbase fetch error', { error: errorMessage, symbol: this.symbol });
      throw new SourceError(`Coinbase error: ${errorMessage}`, this.name);
    }
  }
}
