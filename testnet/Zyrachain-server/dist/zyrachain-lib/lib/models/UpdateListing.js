"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const UpdateListingSchema = new mongoose_1.default.Schema({
    projectName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
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
    updatedInfo: {
        description: {
            type: String,
            trim: true,
            maxlength: 500
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
            trim: true,
            validate: {
                validator: function (v) {
                    if (!v)
                        return true;
                    return /^G[A-Z0-9]{55}$/.test(v);
                },
                message: 'Invalid Pi wallet address format'
            }
        }
    },
    changeReason: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    paymentId: {
        type: String,
        trim: true
    },
    transactionId: {
        type: String,
        trim: true
    },
    paidAt: {
        type: Date
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    processedAt: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
UpdateListingSchema.index({ projectName: 1 });
UpdateListingSchema.index({ email: 1 });
UpdateListingSchema.index({ status: 1 });
UpdateListingSchema.index({ submittedAt: -1 });
exports.default = mongoose_1.default.models.UpdateListing || mongoose_1.default.model('UpdateListing', UpdateListingSchema);
//# sourceMappingURL=UpdateListing.js.map