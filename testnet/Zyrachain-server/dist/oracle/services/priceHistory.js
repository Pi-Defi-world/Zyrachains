"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordPrice = recordPrice;
exports.get24hStats = get24hStats;
exports.trimOldPrices = trimOldPrices;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const COLLECTION = 'price_history';
async function recordPrice(price, source) {
    try {
        if (!mongoose_1.default.connection || mongoose_1.default.connection.readyState !== 1)
            return;
        await mongoose_1.default.connection.collection(COLLECTION).insertOne({
            price,
            source,
            timestamp: new Date(),
        });
    }
    catch (e) {
        logger_1.logger.warn('Failed to record price history', { error: String(e) });
    }
}
async function get24hStats() {
    try {
        if (!mongoose_1.default.connection || mongoose_1.default.connection.readyState !== 1)
            return null;
        const since = new Date(Date.now() - 86400000);
        const docs = await mongoose_1.default.connection
            .collection(COLLECTION)
            .find({ timestamp: { $gte: since } })
            .sort({ timestamp: 1 })
            .toArray();
        if (docs.length === 0)
            return null;
        const prices = docs.map((d) => d.price);
        const high24h = Math.max(...prices);
        const low24h = Math.min(...prices);
        const open24h = docs[0].price;
        const closePrice = docs[docs.length - 1].price;
        return { high24h, low24h, open24h, closePrice };
    }
    catch (e) {
        logger_1.logger.warn('Failed to get 24h stats', { error: String(e) });
        return null;
    }
}
async function trimOldPrices() {
    try {
        if (!mongoose_1.default.connection || mongoose_1.default.connection.readyState !== 1)
            return;
        const cutoff = new Date(Date.now() - 30 * 86400000);
        await mongoose_1.default.connection.collection(COLLECTION).deleteMany({ timestamp: { $lt: cutoff } });
    }
    catch (e) {
        logger_1.logger.warn('Failed to trim price history', { error: String(e) });
    }
}
//# sourceMappingURL=priceHistory.js.map