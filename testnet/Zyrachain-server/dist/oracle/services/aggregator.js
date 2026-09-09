"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceAggregator = void 0;
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
const cache_1 = require("./cache");
class PriceAggregator {
    constructor() {
        this.sources = [];
    }
    addSource(source) {
        this.sources.push(source);
        logger_1.logger.info('Price source added', { source: source.getName() });
    }
    async getAggregatedPrice() {
        const cacheKey = 'aggregated_price';
        const cached = cache_1.cacheService.get(cacheKey);
        if (cached) {
            return { ...cached, cache_hit: true };
        }
        const prices = await this.fetchAllPrices();
        if (prices.length < config_1.config.minSourcesRequired) {
            throw new types_1.PriceOracleError(`Insufficient data sources (${prices.length}/${config_1.config.minSourcesRequired} required)`);
        }
        const filteredPrices = this.removeOutliers(prices);
        if (filteredPrices.length < config_1.config.minSourcesRequired) {
            logger_1.logger.warn('Too many outliers detected, using all prices');
            return this.calculateAggregatedPrice(prices, false);
        }
        const result = this.calculateAggregatedPrice(filteredPrices, false);
        cache_1.cacheService.set(cacheKey, result);
        return result;
    }
    async fetchAllPrices() {
        const promises = this.sources.map(async (source) => {
            try {
                return await source.fetchPrice();
            }
            catch (error) {
                const msg = error instanceof Error ? error.message : 'Unknown error';
                logger_1.logger.warn('Failed to fetch from source', {
                    source: source.getName(),
                    error: msg,
                });
                return null;
            }
        });
        const results = await Promise.allSettled(promises);
        return results
            .filter((result) => result.status === 'fulfilled' && result.value !== null)
            .map((result) => result.value);
    }
    removeOutliers(prices) {
        if (prices.length < 3) {
            return prices;
        }
        const sortedPrices = [...prices].sort((a, b) => a.price - b.price);
        const median = sortedPrices[Math.floor(sortedPrices.length / 2)].price;
        const threshold = (config_1.config.outlierThresholdPercent / 100) * median;
        return prices.filter((p) => {
            const deviation = Math.abs(p.price - median);
            const isOutlier = deviation > threshold;
            if (isOutlier) {
                logger_1.logger.warn('Outlier detected', {
                    source: p.source,
                    price: p.price,
                    median,
                    deviation,
                    threshold,
                });
            }
            return !isOutlier;
        });
    }
    calculateAggregatedPrice(prices, cacheHit) {
        let totalWeight = 0;
        let weightedSum = 0;
        const sourcePrices = {};
        for (const priceData of prices) {
            const weight = priceData.weight || 1.0;
            weightedSum += priceData.price * weight;
            totalWeight += weight;
            sourcePrices[priceData.source] = {
                price: priceData.price,
                weight,
                timestamp: priceData.timestamp,
            };
        }
        const aggregatedPrice = weightedSum / totalWeight;
        const sourceRatio = Math.min(prices.length / this.sources.length, 1.0);
        const mean = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
        const variance = prices.reduce((sum, p) => sum + Math.pow(p.price - mean, 2), 0) / prices.length;
        const stdDev = Math.sqrt(variance);
        const cv = stdDev / mean;
        const consistencyScore = Math.max(0, 1 - cv * 10);
        const confidenceScore = sourceRatio * 0.6 + consistencyScore * 0.4;
        logger_1.logger.info('Price aggregated', {
            price: aggregatedPrice,
            sources_used: prices.length,
            confidence: confidenceScore,
            cv,
        });
        return {
            symbol: 'PI',
            price_usd: aggregatedPrice,
            timestamp: new Date(),
            sources_used: prices.length,
            total_sources: this.sources.length,
            aggregation_method: 'weighted_average',
            source_prices: sourcePrices,
            confidence_score: confidenceScore,
            cache_hit: cacheHit,
        };
    }
    getAllSourceStatuses() {
        return this.sources.map((source) => source.getStatus());
    }
}
exports.PriceAggregator = PriceAggregator;
//# sourceMappingURL=aggregator.js.map