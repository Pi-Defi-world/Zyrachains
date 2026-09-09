import mongoose, { Document, Schema } from 'mongoose';

export interface IEcosystemEvent extends Document {
  title: string;
  description: string;
  date: Date;
  location: string;
  type: 'upcoming' | 'past';
  link?: string;
  organizer?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EcosystemEventSchema = new Schema<IEcosystemEvent>({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  type: {
    type: String,
    enum: ['upcoming', 'past'],
    required: [true, 'Event type is required']
  },
  link: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Link must be a valid URL'
    }
  },
  organizer: {
    type: String,
    trim: true,
    maxlength: [100, 'Organizer name cannot exceed 100 characters']
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
EcosystemEventSchema.index({ date: -1, type: 1 });
EcosystemEventSchema.index({ title: 'text', description: 'text' });

export default mongoose.models.EcosystemEvent || mongoose.model<IEcosystemEvent>('EcosystemEvent', EcosystemEventSchema); 