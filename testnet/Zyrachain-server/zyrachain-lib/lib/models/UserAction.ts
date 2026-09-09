import mongoose, { Schema, Document } from 'mongoose';

export type ActionType = 'like' | 'dislike' | 'tip' | 'reshare' | 'boost' | 'report';

export interface IUserAction extends Document {
  user_uid: string;
  post_uid: mongoose.Types.ObjectId;
  action_type: ActionType;
  token_amount: number | null;
  metadata: Record<string, any>;
  createdAt: Date;
}

const UserActionSchema: Schema = new Schema(
  {
    user_uid: {
      type: String,
      required: true,
    },
    post_uid: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    action_type: {
      type: String,
      enum: ['like', 'dislike', 'tip', 'reshare', 'boost', 'report'],
      required: true,
    },
    token_amount: {
      type: Number,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

UserActionSchema.index(
  { user_uid: 1, post_uid: 1, action_type: 1 },
  { unique: true }
);
UserActionSchema.index({ post_uid: 1, action_type: 1 });
UserActionSchema.index({ user_uid: 1, createdAt: -1 });

export default mongoose.models.UserAction || mongoose.model<IUserAction>('UserAction', UserActionSchema);
