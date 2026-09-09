import mongoose, { Schema, Document } from 'mongoose';

export type RewardSource = 'ad' | 'mission' | 'moderation' | 'refund' | 'referral' | 'system';

export interface IRewardLog extends Document {
  user_uid: string;
  amount: number;
  source: RewardSource;
  reference_id: mongoose.Types.ObjectId | null;
  reference_model: string;
  description: string;
  createdAt: Date;
}

const RewardLogSchema: Schema = new Schema(
  {
    user_uid: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      enum: ['ad', 'mission', 'moderation', 'refund', 'referral', 'system'],
      required: true,
    },
    reference_id: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    reference_model: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

RewardLogSchema.index({ user_uid: 1, createdAt: -1 });

export default mongoose.models.RewardLog || mongoose.model<IRewardLog>('RewardLog', RewardLogSchema);
