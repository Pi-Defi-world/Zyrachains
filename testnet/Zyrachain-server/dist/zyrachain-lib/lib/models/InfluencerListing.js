"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const InfluencerListingSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    bio: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300
    },
    expertise: {
        type: String,
        required: true,
        enum: [
            'Blockchain Technology', 'Cryptocurrency Trading', 'DeFi', 'NFTs',
            'Mining', 'Technical Analysis', 'Pi Network', 'Education',
            'Content Creation', 'Community Building', 'Other'
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
    twitter: {
        type: String,
        trim: true
    },
    youtube: {
        type: String,
        trim: true
    },
    instagram: {
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
InfluencerListingSchema.index({ name: 1 });
InfluencerListingSchema.index({ expertise: 1 });
InfluencerListingSchema.index({ status: 1 });
exports.default = mongoose_1.default.models.InfluencerListing || mongoose_1.default.model('InfluencerListing', InfluencerListingSchema);
//# sourceMappingURL=InfluencerListing.js.map