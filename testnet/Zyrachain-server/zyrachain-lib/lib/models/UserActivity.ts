import mongoose, { Schema, Document } from 'mongoose';

export type ActivityEvent =
  | 'post_created'
  | 'post_liked'
  | 'post_disliked'
  | 'post_tipped'
  | 'post_reshared'
  | 'post_boosted'
  | 'user_followed'
  | 'badge_earned'
  | 'level_up'
  | 'mission_completed'
  | 'comment_added';

export interface IUserActivity extends Document {
  user_uid: string;
  event_type: ActivityEvent;
  actor_uid: string | null;
  reference_id: mongoose.Types.ObjectId | null;
  reference_model: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

const UserActivitySchema: Schema = new Schema(
  {
    user_uid: {
      type: String,
      required: true,
      index: true,
    },
    event_type: {
      type: String,
      enum: [
        'post_created', 'post_liked', 'post_disliked', 'post_tipped',
        'post_reshared', 'post_boosted', 'user_followed', 'badge_earned',
        'level_up', 'mission_completed', 'comment_added',
      ],
      required: true,
    },
    actor_uid: {
      type: String,
      default: null,
      index: true,
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

UserActivitySchema.index({ user_uid: 1, createdAt: -1 });
UserActivitySchema.index({ actor_uid: 1, createdAt: -1 });
UserActivitySchema.index({ event_type: 1, createdAt: -1 });

export default mongoose.models.UserActivity || mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);
