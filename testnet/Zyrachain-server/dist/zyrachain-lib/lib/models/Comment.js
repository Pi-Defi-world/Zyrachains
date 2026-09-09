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
const CommentSchema = new mongoose_1.Schema({
    postId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'BlogPost',
        required: [true, 'Post ID is required'],
    },
    author: {
        name: {
            type: String,
            required: [true, 'Author name is required'],
            trim: true,
            maxlength: [50, 'Author name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Author email is required'],
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
        },
        website: {
            type: String,
            trim: true,
            match: [/^https?:\/\/.+/, 'Please provide a valid URL'],
        },
    },
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true,
        maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'spam', 'rejected'],
        default: 'pending',
    },
    parentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
    },
}, {
    timestamps: true,
});
CommentSchema.index({ postId: 1, status: 1, createdAt: -1 });
CommentSchema.index({ status: 1 });
CommentSchema.index({ 'author.email': 1 });
CommentSchema.index({ parentId: 1 });
CommentSchema.pre('save', function (next) {
    const spamPatterns = [
        /viagra/i,
        /casino/i,
        /lottery/i,
        /click here/i,
        /http[s]?:\/\/[^\s]+/g,
    ];
    let urlCount = 0;
    const urls = this.content.match(/http[s]?:\/\/[^\s]+/g);
    if (urls) {
        urlCount = urls.length;
    }
    if (spamPatterns.some(pattern => pattern.test(this.content)) || urlCount > 2) {
        this.status = 'spam';
    }
    next();
});
exports.default = mongoose_1.default.models.Comment || mongoose_1.default.model('Comment', CommentSchema);
//# sourceMappingURL=Comment.js.map