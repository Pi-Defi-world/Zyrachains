"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const CommunityListingSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    category: {
        type: String,
        required: true,
        enum: [
            'Development', 'Trading', 'Mining', 'News & Updates', 'General Discussion',
            'Regional', 'Educational', 'Business', 'Gaming', 'Other'
        ]
    },
    contactEmail: {
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
    telegram: {
        type: String,
        trim: true
    },
    twitter: {
        type: String,
        trim: true
    },
    discord: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
CommunityListingSchema.index({ name: 1 });
CommunityListingSchema.index({ category: 1 });
CommunityListingSchema.index({ status: 1 });
exports.default = mongoose_1.default.models.CommunityListing || mongoose_1.default.model('CommunityListing', CommunityListingSchema);
//# sourceMappingURL=CommunityListing.js.map