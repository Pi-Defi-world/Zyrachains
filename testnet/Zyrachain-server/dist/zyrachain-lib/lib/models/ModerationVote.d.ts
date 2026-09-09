import mongoose, { Document } from 'mongoose';
export interface IModerationVote extends Document {
    post_uid: mongoose.Types.ObjectId;
    moderator_uid: string;
    vote: 'flag' | 'approve' | 'abstain';
    token_staked: number;
    reason: string;
    resolved: boolean;
    resolution: 'win' | 'loss' | null;
    resolved_at: Date | null;
    createdAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=ModerationVote.d.ts.map