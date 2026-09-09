import mongoose, { Document } from 'mongoose';
export type RewardSource = 'ad' | 'mission' | 'moderation' | 'refund' | 'referral' | 'system';
export interface IRewardLog extends Document {
    user_uid: string;
    amount: number;
    source: RewardSource;
    reference_id: mongoose.Types.ObjectId | null;
    reference_model: string;
    description: string;
    createdAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=RewardLog.d.ts.map