import axios from 'axios';
import { PriceSource, PriceData, SourceError } from '../types';
import { logger } from '../utils/logger';

export class KuCoinSource extends PriceSource {
  private baseUrl = 'https://api.kucoin.com/api/v1';

  async fetchPrice(): Promise<PriceData> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}/market/orderbook/level1`;
      const response = await axios.get(url, {
        params: { symbol: this.symbol },
        timeout: 5000,
      });

      if (!response.data || response.data.code !== '200000' || !response.data.data) {
        throw new SourceError('Invalid response from KuCoin', this.name);
      }

      const price = parseFloat(response.data.data.price);

      if (!price || isNaN(price)) {
        throw new SourceError('Invalid price data from KuCoin', this.name);
      }

      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);

      logger.info('KuCoin price fetched', { price, responseTime });

      return {
        price,
        timestamp: new Date(),
        source: this.name,
        weight: this.weight,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.msg || error.message;
      this.recordError(errorMessage);
      logger.error('KuCoin fetch error', { error: errorMessage, symbol: this.symbol });
      throw new SourceError(`KuCoin error: ${errorMessage}`, this.name);
    }
  }
}
