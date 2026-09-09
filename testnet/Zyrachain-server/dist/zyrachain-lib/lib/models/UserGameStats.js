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
const UserGameStatsSchema = new mongoose_1.Schema({
    user_uid: {
        type: String,
        required: true,
        unique: true,
    },
    xp: {
        type: Number,
        default: 0,
        min: 0,
    },
    level: {
        type: Number,
        default: 1,
        min: 1,
        max: 50,
    },
    streak_days: {
        type: Number,
        default: 0,
        min: 0,
    },
    last_active_date: {
        type: Date,
        default: null,
    },
    weekly_xp: {
        type: Number,
        default: 0,
        min: 0,
    },
    weekly_reset_at: {
        type: Date,
        default: () => {
            const now = new Date();
            now.setUTCHours(0, 0, 0, 0);
            const day = now.getUTCDay();
            const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
            now.setUTCDate(diff);
            return now;
        },
    },
    total_missions_completed: {
        type: Number,
        default: 0,
    },
    total_posts: {
        type: Number,
        default: 0,
    },
    total_likes_received: {
        type: Number,
        default: 0,
    },
    total_tips_received: {
        type: Number,
        default: 0,
    },
}, { timestamps: { createdAt: false, updatedAt: true } });
UserGameStatsSchema.index({ weekly_xp: -1 });
UserGameStatsSchema.index({ level: -1, xp: -1 });
exports.default = mongoose_1.default.models.UserGameStats || mongoose_1.default.model('UserGameStats', UserGameStatsSchema);
//# sourceMappingURL=UserGameStats.js.map