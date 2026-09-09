"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceError = exports.PriceOracleError = exports.PriceSource = void 0;
class PriceSource {
    constructor(name, weight, symbol) {
        this.lastSuccess = null;
        this.lastError = null;
        this.successCount = 0;
        this.errorCount = 0;
        this.responseTimes = [];
        this.name = name;
        this.weight = weight;
        this.symbol = symbol;
    }
    getName() {
        return this.name;
    }
    getWeight() {
        return this.weight;
    }
    getStatus() {
        const totalRequests = this.successCount + this.errorCount;
        const successRate = totalRequests > 0 ? this.successCount / totalRequests : 0;
        const avgResponseTime = this.responseTimes.length > 0
            ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
            : 0;
        return {
            name: this.name,
            status: this.errorCount === 0 || this.successCount > 0 ? 'active' : 'error',
            last_success: this.lastSuccess,
            last_error: this.lastError,
            success_rate: successRate,
            avg_response_time_ms: avgResponseTime,
        };
    }
    recordSuccess(responseTime) {
        this.successCount++;
        this.lastSuccess = new Date();
        this.responseTimes.push(responseTime);
        if (this.responseTimes.length > 100) {
            this.responseTimes.shift();
        }
    }
    recordError(error) {
        this.errorCount++;
        this.lastError = error;
    }
}
exports.PriceSource = PriceSource;
class PriceOracleError extends Error {
    constructor(message, source) {
        super(message);
        this.source = source;
        this.name = 'PriceOracleError';
    }
}
exports.PriceOracleError = PriceOracleError;
class SourceError extends Error {
    constructor(message, source) {
        super(message);
        this.source = source;
        this.name = 'SourceError';
    }
}
exports.SourceError = SourceError;
//# sourceMappingURL=index.js.map