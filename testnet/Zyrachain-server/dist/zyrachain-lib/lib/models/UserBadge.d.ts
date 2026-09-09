import mongoose, { Document } from 'mongoose';
export interface IUserBadge extends Document {
    user_uid: string;
    badge_id: mongoose.Types.ObjectId;
    earned_at: Date;
    expires_at: Date | null;
    metadata: Record<string, any>;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=UserBadge.d.ts.map