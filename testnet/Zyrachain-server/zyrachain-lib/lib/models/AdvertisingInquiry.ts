import mongoose, { Schema, Document } from 'mongoose';

export interface IAdvertisingInquiry extends Document {
  companyName: string;
  contactName: string;
  email: string;
  industry: string;
  budget: string;
  campaignType: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'contacted' | 'converted' | 'rejected';
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdvertisingInquirySchema: Schema = new Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    contactName: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      maxlength: [100, 'Contact name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format'
      }
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      enum: [
        'Cryptocurrency Exchange', 'Wallet Services', 'DeFi Platforms', 'NFT Marketplaces',
        'Blockchain Development', 'Mining Equipment', 'Educational Content', 'Trading Tools',
        'Financial Services', 'Gaming', 'E-commerce', 'Other'
      ]
    },
    budget: {
      type: String,
      required: [true, 'Budget is required'],
      enum: ['$50-100', '$100-250', '$250-500', '$500-1000', '$1000+']
    },
    campaignType: {
      type: String,
      required: [true, 'Campaign type is required'],
      enum: [
        'Banner Advertising', 'Sponsored Content', 'Newsletter Sponsorship', 'Event Sponsorship',
        'Product Launch', 'Brand Awareness', 'Lead Generation', 'Community Building'
      ]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'reviewed', 'contacted', 'converted', 'rejected'],
      default: 'pending'
    },
    ipAddress: {
      type: String,
      required: true,
      trim: true
    },
    userAgent: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for efficient querying
AdvertisingInquirySchema.index({ status: 1, createdAt: -1 });
AdvertisingInquirySchema.index({ email: 1 });
AdvertisingInquirySchema.index({ industry: 1 });
AdvertisingInquirySchema.index({ budget: 1 });

// Virtual for formatted creation date
AdvertisingInquirySchema.virtual('formattedDate').get(function(this: IAdvertisingInquiry) {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Ensure virtuals are included in JSON output
AdvertisingInquirySchema.set('toJSON', { virtuals: true });
AdvertisingInquirySchema.set('toObject', { virtuals: true });

export default (mongoose.models.AdvertisingInquiry as mongoose.Model<IAdvertisingInquiry>) || 
  mongoose.model<IAdvertisingInquiry>('AdvertisingInquiry', AdvertisingInquirySchema); 