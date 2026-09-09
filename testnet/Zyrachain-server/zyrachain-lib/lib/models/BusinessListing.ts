import mongoose from 'mongoose';

export interface IBusinessListing {
  _id?: string;
  name: string;
  category: string;
  description: string;
  city: string;
  country: string;
  email: string;
  website?: string;
  piWalletAddress?: string;
  acceptsPiPayments: boolean;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  approvedAt?: Date;
  featured: boolean;
}

const BusinessListingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Restaurant & Food', 'Retail & Shopping', 'Health & Wellness', 'Beauty & Personal Care',
      'Automotive', 'Home & Garden', 'Professional Services', 'Financial Services',
      'Real Estate', 'Travel & Tourism', 'Entertainment', 'Sports & Recreation',
      'Education & Training', 'Technology', 'Manufacturing', 'Construction',
      'Transportation', 'Agriculture', 'Non-Profit', 'Government', 'Other'
    ]
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  country: {
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
  },
  acceptsPiPayments: {
    type: Boolean,
    required: true,
    default: false
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

// Indexes for efficient querying
BusinessListingSchema.index({ category: 1 });
BusinessListingSchema.index({ city: 1 });
BusinessListingSchema.index({ country: 1 });
BusinessListingSchema.index({ status: 1 });
BusinessListingSchema.index({ featured: -1, submittedAt: -1 });
BusinessListingSchema.index({ acceptsPiPayments: 1 });

export default mongoose.models.BusinessListing || mongoose.model<IBusinessListing>('BusinessListing', BusinessListingSchema); 