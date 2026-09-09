import mongoose, { Schema, Document } from 'mongoose';

export interface ISocialBoost extends Document {
  post_uid: mongoose.Types.ObjectId;
  booster_uid: string;
  amount: number;
  expires_at: Date;
  active: boolean;
  createdAt: Date;
}

const SocialBoostSchema: Schema = new Schema(
  {
    post_uid: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    booster_uid: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    expires_at: {
      type: Date,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SocialBoostSchema.index({ post_uid: 1, active: 1 });
SocialBoostSchema.index({ booster_uid: 1, createdAt: -1 });

export default mongoose.models.SocialBoost || mongoose.model<ISocialBoost>('SocialBoost', SocialBoostSchema);
