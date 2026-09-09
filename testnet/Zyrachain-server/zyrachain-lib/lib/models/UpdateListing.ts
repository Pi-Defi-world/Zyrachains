import mongoose from 'mongoose';

export interface IUpdateListing {
  _id?: string;
  projectName: string;
  email: string;
  updatedInfo: {
    description?: string;
    website?: string;
    piWalletAddress?: string;
  };
  changeReason: string;
  status: 'pending' | 'approved' | 'rejected';
  paymentId?: string;
  transactionId?: string;
  paidAt?: Date;
  submittedAt: Date;
  processedAt?: Date;
}

const UpdateListingSchema = new mongoose.Schema({
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
      validator: function(v: string) {
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
        validator: function(v: string) {
          if (!v) return true;
          return /^https?:\/\/.+\..+/.test(v);
        },
        message: 'Invalid website URL format'
      }
    },
    piWalletAddress: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true;
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

// Indexes
UpdateListingSchema.index({ projectName: 1 });
UpdateListingSchema.index({ email: 1 });
UpdateListingSchema.index({ status: 1 });
UpdateListingSchema.index({ submittedAt: -1 });

export default mongoose.models.UpdateListing || mongoose.model<IUpdateListing>('UpdateListing', UpdateListingSchema); 