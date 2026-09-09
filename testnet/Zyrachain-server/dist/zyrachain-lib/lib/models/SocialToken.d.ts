import mongoose, { Document } from 'mongoose';
export interface ISocialToken extends Document {
    user_uid: string;
    balance: number;
    earned_balance: number;
    purchased_balance: number;
    ad_balance: number;
    total_spent: number;
    total_earned: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=SocialToken.d.ts.map