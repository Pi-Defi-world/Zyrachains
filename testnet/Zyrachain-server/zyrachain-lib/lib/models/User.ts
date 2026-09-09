import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  user_uid: string; // Primary identifier from Pi Network
  piUsername?: string;
  from_address?: string; // Pi wallet address
  to_address?: string; // App wallet address
  role: 'admin' | 'editor' | 'author' | 'reader';
  avatar?: string;
  bio?: string;
  // Authentication metadata
  piAccessToken?: string;
  piAuthenticatedAt?: Date;
  // Additional Pi Network data
  piAppId?: string;
  piCredentials?: {
    scopes: string[];
    valid_until: {
      timestamp: number;
      iso8601: string;
    };
  };
  piReceivingEmail?: boolean;
  // Referral system
  referred_by?: string; // piUsername of the user who referred this user
  referred_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    // Pi Network authentication - primary identifier
    user_uid: {
      type: String,
      required: [true, 'Pi User UID is required'],
      unique: true,
    },
    piUsername: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values
    },
    from_address: {
      type: String, // Pi wallet address
    },
    to_address: {
      type: String, // App wallet address
    },
    role: {
      type: String,
      enum: ['admin', 'editor', 'author', 'reader'],
      default: 'reader',
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    // Authentication metadata
    piAccessToken: {
      type: String,
      select: false, // Don't include token in queries by default
    },
    piAuthenticatedAt: {
      type: Date,
    },
    // Referral system
    referred_by: {
      type: String,
      trim: true,
      index: true,
    },
    referred_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes are automatically created by unique: true on user_uid and piUsername

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 