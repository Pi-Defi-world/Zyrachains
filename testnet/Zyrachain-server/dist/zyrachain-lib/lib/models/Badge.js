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
const BadgeSchema = new mongoose_1.Schema({
    badge_key: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    icon: {
        type: String,
        default: '',
    },
    category: {
        type: String,
        enum: ['follower_based', 'paid', 'achievement', 'moderator', 'special'],
        required: true,
    },
    criteria: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    price: {
        type: Number,
        default: null,
    },
    tier: {
        type: Number,
        default: 1,
    },
    active: {
        type: Boolean,
        default: true,
    },
}, { timestamps: { createdAt: true, updatedAt: false } });
BadgeSchema.index({ category: 1, tier: 1 });
BadgeSchema.index({ badge_key: 1, active: 1 });
exports.default = mongoose_1.default.models.Badge || mongoose_1.default.model('Badge', BadgeSchema);
//# sourceMappingURL=Badge.js.map