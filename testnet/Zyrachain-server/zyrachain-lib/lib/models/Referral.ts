import mongoose, { Schema, Document } from 'mongoose';

export interface IReferral extends Document {
  referrer_uid: string;
  referrer_username: string;
  referred_uid: string;
  referred_username: string;
  reward_zp: number;
  status: 'rewarded' | 'pending';
  createdAt: Date;
}

const ReferralSchema: Schema = new Schema(
  {
    referrer_uid: {
      type: String,
      required: true,
      index: true,
    },
    referrer_username: {
      type: String,
      required: true,
    },
    referred_uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    referred_username: {
      type: String,
      required: true,
    },
    reward_zp: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['rewarded', 'pending'],
      default: 'rewarded',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Referral || mongoose.model<IReferral>('Referral', ReferralSchema);