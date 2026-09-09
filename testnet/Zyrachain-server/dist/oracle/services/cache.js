"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
class CacheService {
    constructor() {
        this.cache = new node_cache_1.default({
            stdTTL: config_1.config.cacheTTL,
            checkperiod: config_1.config.cacheTTL * 0.2,
            useClones: false,
        });
        this.cache.on('set', (key) => {
            logger_1.logger.debug('Cache set', { key });
        });
        this.cache.on('expired', (key) => {
            logger_1.logger.debug('Cache expired', { key });
        });
    }
    get(key) {
        const value = this.cache.get(key);
        if (value !== undefined) {
            logger_1.logger.debug('Cache hit', { key });
        }
        else {
            logger_1.logger.debug('Cache miss', { key });
        }
        return value;
    }
    set(key, value, ttl) {
        return this.cache.set(key, value, ttl || config_1.config.cacheTTL);
    }
    delete(key) {
        return this.cache.del(key);
    }
    flush() {
        this.cache.flushAll();
        logger_1.logger.info('Cache flushed');
    }
    getStats() {
        return this.cache.getStats();
    }
}
exports.cacheService = new CacheService();
//# sourceMappingURL=cache.js.map