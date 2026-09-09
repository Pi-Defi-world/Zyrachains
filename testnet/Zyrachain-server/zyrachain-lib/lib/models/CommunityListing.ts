import mongoose from 'mongoose';

export interface ICommunityListing {
  _id?: string;
  name: string;
  description: string;
  category: string;
  contactEmail: string;
  website?: string;
  telegram?: string;
  twitter?: string;
  discord?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const CommunityListingSchema = new mongoose.Schema({
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

// Indexes for efficient querying
CommunityListingSchema.index({ name: 1 });
CommunityListingSchema.index({ category: 1 });
CommunityListingSchema.index({ status: 1 });

export default mongoose.models.CommunityListing || mongoose.model<ICommunityListing>('CommunityListing', CommunityListingSchema); 