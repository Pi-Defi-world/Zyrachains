import mongoose, { Document, Schema } from 'mongoose';

export interface IEcosystemCommunity extends Document {
  name: string;
  description: string;
  category: string;
  link: string;
  country?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EcosystemCommunitySchema = new Schema<IEcosystemCommunity>({
  name: {
    type: String,
    required: [true, 'Community name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Community description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Community category is required'],
    trim: true,
    enum: ['Development', 'Regional', 'Business', 'Education', 'Trading', 'General'],
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  link: {
    type: String,
    required: [true, 'Community link is required'],
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Link must be a valid URL'
    }
  },
  country: {
    type: String,
    trim: true,
    maxlength: [100, 'Country cannot exceed 100 characters']
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for efficient querying
EcosystemCommunitySchema.index({ category: 1, country: 1 });
EcosystemCommunitySchema.index({ name: 'text', description: 'text' });

export default mongoose.models.EcosystemCommunity || mongoose.model<IEcosystemCommunity>('EcosystemCommunity', EcosystemCommunitySchema); 