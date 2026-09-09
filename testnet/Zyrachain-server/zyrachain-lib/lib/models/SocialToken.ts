import mongoose, { Schema, Document } from 'mongoose';

export interface ISocialToken extends Document {
  user_uid: string;
  balance: number;
  earned_balance: number;
  purchased_balance: number;
  ad_balance: number;
  total_spent: number;
  total_earned: number;
  createdAt: Date;
  updatedAt: Date;
}

const SocialTokenSchema: Schema = new Schema(
  {
    user_uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    earned_balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    purchased_balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    ad_balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    total_spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    total_earned: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.SocialToken || mongoose.model<ISocialToken>('SocialToken', SocialTokenSchema);
