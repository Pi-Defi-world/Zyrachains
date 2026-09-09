import mongoose, { Document, Schema } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  role: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const OTPSchema = new Schema<IOTP>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  role: {
    type: String,
    required: true,
    enum: ['super_admin', 'admin', 'editor_admin']
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Auto-delete expired documents
  },
  used: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for quick lookups
OTPSchema.index({ email: 1, used: 1 });
OTPSchema.index({ otp: 1, used: 1 });

export default mongoose.model<IOTP>('OTP', OTPSchema); 