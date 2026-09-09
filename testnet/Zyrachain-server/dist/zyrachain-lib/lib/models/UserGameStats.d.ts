import mongoose, { Document } from 'mongoose';
export interface IUserGameStats extends Document {
    user_uid: string;
    xp: number;
    level: number;
    streak_days: number;
    last_active_date: Date | null;
    weekly_xp: number;
    weekly_reset_at: Date;
    total_missions_completed: number;
    total_posts: number;
    total_likes_received: number;
    total_tips_received: number;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=UserGameStats.d.ts.map