import mongoose from 'mongoose';

export interface ICoreTeamContact {
  _id?: string;
  contactInfo: {
    name: string;
    email: string;
    organization?: string;
    role: string;
  };
  inquiry: {
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    subject: string;
    details: string;
  };
  projectInfo?: {
    name: string;
    stage: string;
    piIntegration: string;
    website?: string;
  };
  status: 'new' | 'in_progress' | 'responded' | 'resolved' | 'closed';
  submittedAt: Date;
  respondedAt?: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  response?: string;
  internalNotes?: string;
  followUpRequired: boolean;
  expectedResponseTime: number; // in hours
}

const CoreTeamContactSchema = new mongoose.Schema({
  contactInfo: {
    name: {
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
    organization: {
      type: String,
      trim: true,
      maxlength: 200
    },
    role: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    }
  },
  inquiry: {
    category: {
      type: String,
      required: true,
      enum: [
        'Partnership Proposal',
        'Integration Support',
        'Technical Collaboration',
        'Business Development',
        'Ecosystem Proposal',
        'Media & Press',
        'Academic Research',
        'Security Issues',
        'Strategic Alliance'
      ]
    },
    priority: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    details: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    }
  },
  projectInfo: {
    name: {
      type: String,
      trim: true,
      maxlength: 100
    },
    stage: {
      type: String,
      trim: true,
      maxlength: 50
    },
    piIntegration: {
      type: String,
      trim: true,
      maxlength: 200
    },
    website: {
      type: String,
      trim: true
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['new', 'in_progress', 'responded', 'resolved', 'closed'],
    default: 'new'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  assignedTo: {
    type: String,
    trim: true
  },
  response: {
    type: String,
    trim: true
  },
  internalNotes: {
    type: String,
    trim: true
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  expectedResponseTime: {
    type: Number,
    required: true,
    default: function(this: ICoreTeamContact) {
      switch (this.inquiry?.priority) {
        case 'urgent': return 4;   // 4 hours
        case 'high': return 24;    // 1 day
        case 'medium': return 72;  // 3 days
        case 'low': return 168;    // 1 week
        default: return 72;
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
CoreTeamContactSchema.index({ 'contactInfo.email': 1 });
CoreTeamContactSchema.index({ 'inquiry.category': 1 });
CoreTeamContactSchema.index({ 'inquiry.priority': 1 });
CoreTeamContactSchema.index({ status: 1 });
CoreTeamContactSchema.index({ submittedAt: -1 });
CoreTeamContactSchema.index({ assignedTo: 1 });

// Virtual for overdue inquiries
CoreTeamContactSchema.virtual('isOverdue').get(function() {
  if (this.status === 'resolved' || this.status === 'closed') return false;
  const now = new Date();
  const deadlineTime = this.submittedAt.getTime() + (this.expectedResponseTime * 60 * 60 * 1000);
  return now.getTime() > deadlineTime;
});

export default mongoose.models.CoreTeamContact || mongoose.model<ICoreTeamContact>('CoreTeamContact', CoreTeamContactSchema); 