"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ApiKeySchema = new mongoose_1.Schema({
    keyHash: { type: String, required: true, unique: true, index: true },
    keyPrefix: { type: String, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    piUid: { type: String },
    name: { type: String, default: 'Oracle API Key' },
    paymentId: { type: String, required: true, index: true },
    transactionId: { type: String },
    status: {
        type: String,
        enum: ['active', 'revoked', 'expired'],
        default: 'active',
    },
    rateLimit: {
        requestsPerMinute: { type: Number, default: 60 },
        requestsPerDay: { type: Number, default: 10000 },
    },
    usage: {
        totalRequests: { type: Number, default: 0 },
        lastUsedAt: { type: Date },
    },
    credits: { type: Number, default: 0 },
    creditCostPerRequest: { type: Number, default: 0.01 },
    expiresAt: { type: Date },
}, { timestamps: true });
exports.default = mongoose_1.default.models.ApiKey || mongoose_1.default.model('ApiKey', ApiKeySchema);
//# sourceMappingURL=ApiKey.js.map