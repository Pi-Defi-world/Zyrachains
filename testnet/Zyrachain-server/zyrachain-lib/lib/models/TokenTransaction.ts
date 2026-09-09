import mongoose, { Schema, Document } from 'mongoose';

export type TokenTxType =
  | 'purchase'
  | 'post_cost'
  | 'comment_cost'
  | 'like_cost'
  | 'dislike_cost'
  | 'tip'
  | 'reshare_cost'
  | 'boost_cost'
  | 'ad_reward'
  | 'moderation_reward'
  | 'moderation_loss'
  | 'badge_purchase'
  | 'mission_reward'
  | 'refund'
  | 'platform_fee'
  | 'creator_earning'
  | 'referral_reward';

export interface ITokenTransaction extends Document {
  from_user_uid: string | null;
  to_user_uid: string | null;
  amount: number;
  tx_type: TokenTxType;
  reference_id: mongoose.Types.ObjectId | null;
  reference_model: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

const TokenTransactionSchema: Schema = new Schema(
  {
    from_user_uid: {
      type: String,
      default: null,
      index: true,
    },
    to_user_uid: {
      type: String,
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    tx_type: {
      type: String,
      enum: [
        'purchase', 'post_cost', 'comment_cost', 'like_cost', 'dislike_cost',
        'tip', 'reshare_cost', 'boost_cost', 'ad_reward', 'moderation_reward',
        'moderation_loss', 'badge_purchase', 'mission_reward', 'refund',
        'platform_fee', 'creator_earning', 'referral_reward',
      ],
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
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

TokenTransactionSchema.index({ from_user_uid: 1, createdAt: -1 });
TokenTransactionSchema.index({ to_user_uid: 1, createdAt: -1 });
TokenTransactionSchema.index({ tx_type: 1 });

export default mongoose.models.TokenTransaction || mongoose.model<ITokenTransaction>('TokenTransaction', TokenTransactionSchema);
