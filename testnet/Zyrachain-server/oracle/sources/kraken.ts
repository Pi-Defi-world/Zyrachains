import axios from 'axios';
import { PriceSource, PriceData, SourceError } from '../types';
import { logger } from '../utils/logger';

export class KrakenSource extends PriceSource {
  private baseUrl = 'https://api.kraken.com/0/public';

  async fetchPrice(): Promise<PriceData> {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}/Ticker`;
      const response = await axios.get(url, {
        params: { pair: this.symbol },
        timeout: 5000,
      });

      const pairData = response.data?.result?.[this.symbol];
      if (!pairData || !pairData.c || !pairData.c[0]) {
        throw new SourceError('Invalid response from Kraken', this.name);
      }

      const price = parseFloat(pairData.c[0]);

      if (!price || isNaN(price)) {
        throw new SourceError('Invalid price data from Kraken', this.name);
      }

      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);

      logger.info('Kraken price fetched', { price, responseTime });

      return {
        price,
        timestamp: new Date(),
        source: this.name,
        weight: this.weight,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.[0] || error.message;
      this.recordError(errorMessage);
      logger.error('Kraken fetch error', { error: errorMessage, symbol: this.symbol });
      throw new SourceError(`Kraken error: ${errorMessage}`, this.name);
    }
  }
}
