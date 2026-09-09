"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureHotIndexes = ensureHotIndexes;
const mongoose_1 = __importDefault(require("mongoose"));
async function ensureHotIndexes() {
    const db = mongoose_1.default.connection.db;
    if (!db)
        return;
    const tasks = [
        db.collection('pct-balance-events').createIndex({ detectedAt: -1, _id: -1 }),
        db.collection('pct-balance-events').createIndex({ wallet: 1, detectedAt: -1 }),
        db.collection('pct-balance-events').createIndex({ transactionHash: 1, wallet: 1 }, { unique: true }),
        db.collection('pct-wallet-state').createIndex({ lastBalance: -1 }),
        db.collection('pct-wallet-state').createIndex({ identifier: 1 }),
        db.collection('pct-wallet-movements').createIndex({ paymentId: 1 }),
        db.collection('pct-wallet-movements').createIndex({ transactionHash: 1, wallet: 1 }, { unique: true }),
        db.collection('pct-wallet-movements').createIndex({ detectedAt: -1, _id: -1 }),
        db.collection('pct-stream-state').createIndex({ leaseExpiresAt: 1 }),
        db.collection('core-team-addresses').createIndex({ identifier: 1 }),
        db.collection('cex-addresses').createIndex({ identifier: 1 }),
        db.collection('generated-addresses').createIndex({ identifier: 1 }),
        db.collection('snapshots').createIndex({ updatedAt: -1 }),
        db.collection('pct-summary').createIndex({ updatedAt: -1 }),
    ];
    await Promise.allSettled(tasks);
}
//# sourceMappingURL=ensureIndexes.js.map