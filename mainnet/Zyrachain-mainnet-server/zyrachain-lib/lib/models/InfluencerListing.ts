import mongoose from 'mongoose';

export interface IInfluencerListing {
  _id?: string;
  name: string;
  bio: string;
  expertise: string;
  contactEmail: string;
  twitter?: string;
  youtube?: string;
  instagram?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const InfluencerListingSchema = new mongoose.Schema({
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
      validator: function(v: string) {
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

// Indexes for efficient querying
InfluencerListingSchema.index({ name: 1 });
InfluencerListingSchema.index({ expertise: 1 });
InfluencerListingSchema.index({ status: 1 });

export default mongoose.models.InfluencerListing || mongoose.model<IInfluencerListing>('InfluencerListing', InfluencerListingSchema); 