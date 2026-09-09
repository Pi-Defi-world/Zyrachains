"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ProjectListingSchema = new mongoose_1.default.Schema({
    projectName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        unique: true
    },
    category: {
        type: String,
        required: true,
        enum: ['DeFi', 'Gaming', 'NFT/Metaverse', 'Social', 'Marketplace', 'Tools', 'Education', 'Entertainment', 'Productivity', 'Other']
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Invalid email format'
        }
    },
    website: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v)
                    return true;
                return /^https?:\/\/.+\..+/.test(v);
            },
            message: 'Invalid website URL format'
        }
    },
    piWalletAddress: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^G[A-Z0-9]{55}$/.test(v);
            },
            message: 'Invalid Pi wallet address format'
        }
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    approvedAt: {
        type: Date
    },
    featured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
ProjectListingSchema.index({ projectName: 'text', description: 'text' });
ProjectListingSchema.index({ category: 1 });
ProjectListingSchema.index({ status: 1 });
ProjectListingSchema.index({ submittedAt: -1 });
ProjectListingSchema.index({ featured: -1, submittedAt: -1 });
exports.default = mongoose_1.default.models.ProjectListing || mongoose_1.default.model('ProjectListing', ProjectListingSchema);
//# sourceMappingURL=ProjectListing.js.map