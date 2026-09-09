import mongoose from 'mongoose';

export interface IProjectListing {
  _id?: string;
  projectName: string;
  category: string;
  description: string;
  email: string;
  website?: string;
  piWalletAddress: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  approvedAt?: Date;
  featured: boolean;
}

const ProjectListingSchema = new mongoose.Schema({
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
    required: true,
    trim: true,
    validate: {
      validator: function(v: string) {
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
ProjectListingSchema.index({ projectName: 'text', description: 'text' });
ProjectListingSchema.index({ category: 1 });
ProjectListingSchema.index({ status: 1 });
ProjectListingSchema.index({ submittedAt: -1 });
ProjectListingSchema.index({ featured: -1, submittedAt: -1 });

export default mongoose.models.ProjectListing || mongoose.model<IProjectListing>('ProjectListing', ProjectListingSchema); 