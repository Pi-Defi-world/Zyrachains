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
const AdvertisingInquirySchema = new mongoose_1.Schema({
    companyName: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    contactName: {
        type: String,
        required: [true, 'Contact name is required'],
        trim: true,
        maxlength: [100, 'Contact name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Invalid email format'
        }
    },
    industry: {
        type: String,
        required: [true, 'Industry is required'],
        enum: [
            'Cryptocurrency Exchange', 'Wallet Services', 'DeFi Platforms', 'NFT Marketplaces',
            'Blockchain Development', 'Mining Equipment', 'Educational Content', 'Trading Tools',
            'Financial Services', 'Gaming', 'E-commerce', 'Other'
        ]
    },
    budget: {
        type: String,
        required: [true, 'Budget is required'],
        enum: ['$50-100', '$100-250', '$250-500', '$500-1000', '$1000+']
    },
    campaignType: {
        type: String,
        required: [true, 'Campaign type is required'],
        enum: [
            'Banner Advertising', 'Sponsored Content', 'Newsletter Sponsorship', 'Event Sponsorship',
            'Product Launch', 'Brand Awareness', 'Lead Generation', 'Community Building'
        ]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'reviewed', 'contacted', 'converted', 'rejected'],
        default: 'pending'
    },
    ipAddress: {
        type: String,
        required: true,
        trim: true
    },
    userAgent: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});
AdvertisingInquirySchema.index({ status: 1, createdAt: -1 });
AdvertisingInquirySchema.index({ email: 1 });
AdvertisingInquirySchema.index({ industry: 1 });
AdvertisingInquirySchema.index({ budget: 1 });
AdvertisingInquirySchema.virtual('formattedDate').get(function () {
    return this.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});
AdvertisingInquirySchema.set('toJSON', { virtuals: true });
AdvertisingInquirySchema.set('toObject', { virtuals: true });
exports.default = mongoose_1.default.models.AdvertisingInquiry ||
    mongoose_1.default.model('AdvertisingInquiry', AdvertisingInquirySchema);
//# sourceMappingURL=AdvertisingInquiry.js.map