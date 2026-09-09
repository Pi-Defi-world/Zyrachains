import mongoose, { Schema, Document } from 'mongoose';

export interface IUserFollow extends Document {
  follower_uid: string;
  followed_uid: string;
  createdAt: Date;
}

const UserFollowSchema: Schema = new Schema(
  {
    follower_uid: {
      type: String,
      required: true,
    },
    followed_uid: {
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

UserFollowSchema.index({ follower_uid: 1, followed_uid: 1 }, { unique: true });
UserFollowSchema.index({ followed_uid: 1, createdAt: -1 });
UserFollowSchema.index({ follower_uid: 1, createdAt: -1 });

export default mongoose.models.UserFollow || mongoose.model<IUserFollow>('UserFollow', UserFollowSchema);
