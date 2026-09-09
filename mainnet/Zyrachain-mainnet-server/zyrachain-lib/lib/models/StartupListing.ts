import mongoose from 'mongoose';

export interface IStartupListing {
  _id?: string;
  name: string;
  category: string;
  description: string;
  stage: string;
  email: string;
  website?: string;
  piWalletAddress?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  approvedAt?: Date;
  featured: boolean;
}

const StartupListingSchema = new mongoose.Schema({
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
      'DeFi', 'Gaming', 'NFT/Metaverse', 'Social', 'Marketplace', 
      'Tools', 'Education', 'Entertainment', 'Productivity', 
      'FinTech', 'Healthcare', 'Supply Chain', 'Identity', 'IoT', 'Other'
    ]
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  stage: {
    type: String,
    required: true,
    enum: ['Idea Stage', 'Prototype', 'MVP', 'Beta Testing', 'Pre-Launch', 'Early Access']
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

// Indexes
StartupListingSchema.index({ category: 1 });
StartupListingSchema.index({ stage: 1 });
StartupListingSchema.index({ status: 1 });
StartupListingSchema.index({ submittedAt: -1 });
StartupListingSchema.index({ featured: -1, submittedAt: -1 });

export default mongoose.models.StartupListing || mongoose.model<IStartupListing>('StartupListing', StartupListingSchema); 