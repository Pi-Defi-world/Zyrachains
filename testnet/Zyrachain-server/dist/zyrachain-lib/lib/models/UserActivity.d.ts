import mongoose, { Document } from 'mongoose';
export type ActivityEvent = 'post_created' | 'post_liked' | 'post_disliked' | 'post_tipped' | 'post_reshared' | 'post_boosted' | 'user_followed' | 'badge_earned' | 'level_up' | 'mission_completed' | 'comment_added';
export interface IUserActivity extends Document {
    user_uid: string;
    event_type: ActivityEvent;
    actor_uid: string | null;
    reference_id: mongoose.Types.ObjectId | null;
    reference_model: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=UserActivity.d.ts.map