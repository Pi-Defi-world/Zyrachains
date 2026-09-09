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
const RevenueSchema = new mongoose_1.Schema({
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now,
    },
    source: {
        type: String,
        enum: ['pi_services', 'usdt_services', 'adsense', 'pi_ads', 'referrals', 'listings', 'other'],
        required: [true, 'Revenue source is required'],
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative'],
    },
    currency: {
        type: String,
        enum: ['PI', 'USDT', 'USD'],
        required: [true, 'Currency is required'],
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    transactionId: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
    },
    userId: {
        type: String,
        required: false,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    verified: {
        type: Boolean,
        default: false,
    },
    recordedBy: {
        type: String,
        required: false,
    },
}, {
    timestamps: true,
});
RevenueSchema.index({ date: -1 });
RevenueSchema.index({ source: 1, date: -1 });
RevenueSchema.index({ currency: 1, date: -1 });
RevenueSchema.index({ verified: 1, date: -1 });
RevenueSchema.index({ transactionId: 1 }, { sparse: true });
RevenueSchema.statics.getRevenueSummary = async function (startDate, endDate, source) {
    const matchStage = {};
    if (startDate || endDate) {
        matchStage.date = {};
        if (startDate)
            matchStage.date.$gte = startDate;
        if (endDate)
            matchStage.date.$lte = endDate;
    }
    if (source) {
        matchStage.source = source;
    }
    const pipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: {
                    source: '$source',
                    currency: '$currency'
                },
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 },
                verified: {
                    $sum: {
                        $cond: ['$verified', '$amount', 0]
                    }
                },
                unverified: {
                    $sum: {
                        $cond: ['$verified', 0, '$amount']
                    }
                }
            }
        },
        {
            $group: {
                _id: '$_id.source',
                currencies: {
                    $push: {
                        currency: '$_id.currency',
                        total: '$totalAmount',
                        count: '$count',
                        verified: '$verified',
                        unverified: '$unverified'
                    }
                },
                totalTransactions: { $sum: '$count' }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ];
    return this.aggregate(pipeline);
};
RevenueSchema.statics.getDailyRevenue = async function (startDate, endDate, currency) {
    const matchStage = {
        date: { $gte: startDate, $lte: endDate }
    };
    if (currency) {
        matchStage.currency = currency;
    }
    const pipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: {
                    year: { $year: '$date' },
                    month: { $month: '$date' },
                    day: { $dayOfMonth: '$date' },
                    source: '$source',
                    currency: '$currency'
                },
                amount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: {
                    year: '$_id.year',
                    month: '$_id.month',
                    day: '$_id.day'
                },
                sources: {
                    $push: {
                        source: '$_id.source',
                        currency: '$_id.currency',
                        amount: '$amount',
                        count: '$count'
                    }
                },
                totalAmount: { $sum: '$amount' },
                totalTransactions: { $sum: '$count' }
            }
        },
        {
            $addFields: {
                date: {
                    $dateFromParts: {
                        year: '$_id.year',
                        month: '$_id.month',
                        day: '$_id.day'
                    }
                }
            }
        },
        {
            $sort: { date: 1 }
        }
    ];
    return this.aggregate(pipeline);
};
exports.default = mongoose_1.default.models.Revenue || mongoose_1.default.model('Revenue', RevenueSchema);
//# sourceMappingURL=Revenue.js.map