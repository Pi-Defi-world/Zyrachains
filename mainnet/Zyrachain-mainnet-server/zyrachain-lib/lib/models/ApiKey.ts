import mongoose, { Document, Schema } from 'mongoose';

export interface IApiKey extends Document {
  keyHash: string;
  keyPrefix: string;
  userId: mongoose.Types.ObjectId;
  piUid?: string;
  name: string;
  paymentId: string;
  transactionId?: string;
  status: 'active' | 'revoked' | 'expired';
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  usage: {
    totalRequests: number;
    lastUsedAt?: Date;
  };
  credits: number;
  creditCostPerRequest: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    keyHash: { type: String, required: true, unique: true, index: true },
    keyPrefix: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    piUid: { type: String },
    name: { type: String, default: 'Oracle API Key' },
    paymentId: { type: String, required: true, index: true },
    transactionId: { type: String },
    status: {
      type: String,
      enum: ['active', 'revoked', 'expired'],
      default: 'active',
    },
    rateLimit: {
      requestsPerMinute: { type: Number, default: 60 },
      requestsPerDay: { type: Number, default: 10000 },
    },
    usage: {
      totalRequests: { type: Number, default: 0 },
      lastUsedAt: { type: Date },
    },
    credits: { type: Number, default: 0 },
    creditCostPerRequest: { type: Number, default: 0.01 },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.ApiKey || mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
