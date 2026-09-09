import mongoose, { Schema, Document } from 'mongoose';

export interface IUserBadge extends Document {
  user_uid: string;
  badge_id: mongoose.Types.ObjectId;
  earned_at: Date;
  expires_at: Date | null;
  metadata: Record<string, any>;
}

const UserBadgeSchema: Schema = new Schema(
  {
    user_uid: {
      type: String,
      required: true,
    },
    badge_id: {
      type: Schema.Types.ObjectId,
      ref: 'Badge',
      required: true,
    },
    earned_at: {
      type: Date,
      default: Date.now,
    },
    expires_at: {
      type: Date,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: false }
);

UserBadgeSchema.index({ user_uid: 1, badge_id: 1 }, { unique: true });
UserBadgeSchema.index({ user_uid: 1, earned_at: -1 });

export default mongoose.models.UserBadge || mongoose.model<IUserBadge>('UserBadge', UserBadgeSchema);
