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
const ModerationVoteSchema = new mongoose_1.Schema({
    post_uid: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    moderator_uid: {
        type: String,
        required: true,
    },
    vote: {
        type: String,
        enum: ['flag', 'approve', 'abstain'],
        required: true,
    },
    token_staked: {
        type: Number,
        required: true,
        min: 1,
    },
    reason: {
        type: String,
        maxlength: 500,
        default: '',
    },
    resolved: {
        type: Boolean,
        default: false,
    },
    resolution: {
        type: String,
        enum: ['win', 'loss', null],
        default: null,
    },
    resolved_at: {
        type: Date,
        default: null,
    },
}, { timestamps: { createdAt: true, updatedAt: false } });
ModerationVoteSchema.index({ post_uid: 1, moderator_uid: 1 }, { unique: true });
ModerationVoteSchema.index({ post_uid: 1, resolved: 1 });
ModerationVoteSchema.index({ moderator_uid: 1, createdAt: -1 });
exports.default = mongoose_1.default.models.ModerationVote || mongoose_1.default.model('ModerationVote', ModerationVoteSchema);
//# sourceMappingURL=ModerationVote.js.map