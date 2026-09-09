import mongoose, { Document } from 'mongoose';
export interface ISocialBoost extends Document {
    post_uid: mongoose.Types.ObjectId;
    booster_uid: string;
    amount: number;
    expires_at: Date;
    active: boolean;
    createdAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=SocialBoost.d.ts.map