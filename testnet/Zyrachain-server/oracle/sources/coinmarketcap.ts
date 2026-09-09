import axios from 'axios';
import { PriceSource, PriceData, SourceError } from '../types';
import { logger } from '../utils/logger';

export class CoinMarketCapSource extends PriceSource {
  private baseUrl = 'https://pro-api.coinmarketcap.com/v1';

  async fetchPrice(): Promise<PriceData> {
    const startTime = Date.now();
    const apiKey = process.env.COINMARKETCAP_API_KEY;

    try {
      let price: number;
      if (apiKey) {
        const url = `${this.baseUrl}/cryptocurrency/quotes/latest`;
        const response = await axios.get(url, {
          params: { id: this.symbol, convert: 'USD' },
          headers: { 'X-CMC_PRO_API_KEY': apiKey, 'Accept': 'application/json' },
          timeout: 5000,
        });
        const quote = response.data?.data?.[this.symbol]?.quote?.USD;
        if (!quote || typeof quote.price !== 'number') {
          throw new SourceError('Invalid response from CoinMarketCap', this.name);
        }
        price = quote.price;
      } else {
        const url = 'https://web-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
        const response = await axios.get(url, {
          params: { id: this.symbol, convert: 'USD' },
          headers: { 'Accept': 'application/json' },
          timeout: 5000,
        });
        const quote = response.data?.data?.[this.symbol]?.quote?.USD;
        if (!quote || typeof quote.price !== 'number') {
          throw new SourceError('Invalid response from CoinMarketCap (free)', this.name);
        }
        price = quote.price;
      }

      if (!price || isNaN(price)) {
        throw new SourceError('Invalid price data from CoinMarketCap', this.name);
      }

      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);

      logger.info('CoinMarketCap price fetched', { price, responseTime });

      return {
        price,
        timestamp: new Date(),
        source: this.name,
        weight: this.weight,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.status?.error_message || error.message;
      this.recordError(errorMessage);
      logger.error('CoinMarketCap fetch error', { error: errorMessage, symbol: this.symbol });
      throw new SourceError(`CoinMarketCap error: ${errorMessage}`, this.name);
    }
  }
}
