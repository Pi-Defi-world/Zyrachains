import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRevenue extends Document {
  date: Date;
  source: 'pi_services' | 'usdt_services' | 'adsense' | 'pi_ads' | 'referrals' | 'listings' | 'other';
  amount: number;
  currency: 'PI' | 'USDT' | 'USD';
  description: string;
  transactionId?: string;
  userId?: string;
  metadata: any;
  verified: boolean;
  recordedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRevenueModel extends Model<IRevenue> {
  getRevenueSummary(
    startDate?: Date,
    endDate?: Date,
    source?: string
  ): Promise<any[]>;
  
  getDailyRevenue(
    startDate: Date,
    endDate: Date,
    currency?: string
  ): Promise<any[]>;
}

const RevenueSchema: Schema = new Schema(
  {
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
      sparse: true, // Allows multiple null values
    },
    userId: {
      type: String,
      required: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
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
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
RevenueSchema.index({ date: -1 });
RevenueSchema.index({ source: 1, date: -1 });
RevenueSchema.index({ currency: 1, date: -1 });
RevenueSchema.index({ verified: 1, date: -1 });
RevenueSchema.index({ transactionId: 1 }, { sparse: true });

// Static method to get revenue summary
RevenueSchema.statics.getRevenueSummary = async function(
  startDate?: Date,
  endDate?: Date,
  source?: string
) {
  const matchStage: any = {};
  
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = startDate;
    if (endDate) matchStage.date.$lte = endDate;
  }
  
  if (source) {
    matchStage.source = source;
  }

  const pipeline: any[] = [
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

// Static method to get daily revenue
RevenueSchema.statics.getDailyRevenue = async function(
  startDate: Date,
  endDate: Date,
  currency?: string
) {
  const matchStage: any = {
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (currency) {
    matchStage.currency = currency;
  }

  const pipeline: any[] = [
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

export default (mongoose.models.Revenue as IRevenueModel) || mongoose.model<IRevenue, IRevenueModel>('Revenue', RevenueSchema); 