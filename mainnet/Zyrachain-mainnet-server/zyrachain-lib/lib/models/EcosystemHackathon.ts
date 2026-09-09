import mongoose, { Document, Schema } from 'mongoose';

export interface IEcosystemHackathon extends Document {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  prize: string;
  participants?: number;
  status: 'upcoming' | 'ongoing' | 'ended';
  link?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
}

const EcosystemHackathonSchema = new Schema<IEcosystemHackathon>({
  title: {
    type: String,
    required: [true, 'Hackathon title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Hackathon description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(this: IEcosystemHackathon, value: Date) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  prize: {
    type: String,
    required: [true, 'Prize information is required'],
    trim: true,
    maxlength: [200, 'Prize description cannot exceed 200 characters']
  },
  participants: {
    type: Number,
    min: [0, 'Participants count cannot be negative'],
    default: 0
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'ended'],
    required: [true, 'Hackathon status is required']
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
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
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
EcosystemHackathonSchema.index({ startDate: -1, status: 1 });
EcosystemHackathonSchema.index({ title: 'text', description: 'text' });

export default mongoose.models.EcosystemHackathon || mongoose.model<IEcosystemHackathon>('EcosystemHackathon', EcosystemHackathonSchema); 