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
const PostSchema = new mongoose_1.Schema({
    author_uid: {
        type: String,
        required: true,
        index: true,
    },
    content: {
        type: String,
        required: true,
        maxlength: 2000,
        trim: true,
    },
    images: {
        type: [String],
        default: [],
        validate: [(v) => v.length <= 10, 'Maximum 10 images per post'],
    },
    content_type: {
        type: String,
        enum: ['post', 'comment'],
        default: 'post',
    },
    parent_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Post',
        default: null,
    },
    token_cost: {
        type: Number,
        default: 0,
    },
    tips_received: {
        type: Number,
        default: 0,
    },
    impression_count: {
        type: Number,
        default: 0,
    },
    like_count: {
        type: Number,
        default: 0,
    },
    dislike_count: {
        type: Number,
        default: 0,
    },
    reshare_count: {
        type: Number,
        default: 0,
    },
    comment_count: {
        type: Number,
        default: 0,
    },
    is_boosted: {
        type: Boolean,
        default: false,
    },
    boost_amount: {
        type: Number,
        default: 0,
    },
    boost_expires_at: {
        type: Date,
        default: null,
    },
    status: {
        type: String,
        enum: ['active', 'flagged', 'moderated', 'removed'],
        default: 'active',
    },
    tags: {
        type: [String],
        default: [],
    },
    visibility: {
        type: String,
        enum: ['public', 'followers_only'],
        default: 'public',
    },
    trending_score: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });
PostSchema.index({ content_type: 1, status: 1, createdAt: -1 });
PostSchema.index({ content_type: 1, status: 1, trending_score: -1, createdAt: -1 });
PostSchema.index({ author_uid: 1, createdAt: -1 });
PostSchema.index({ status: 1, is_boosted: 1, boost_expires_at: 1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ content: 'text', tags: 'text' });
PostSchema.index({ parent_id: 1, createdAt: -1 });
exports.default = mongoose_1.default.models.Post || mongoose_1.default.model('Post', PostSchema);
//# sourceMappingURL=Post.js.map