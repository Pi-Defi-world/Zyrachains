import mongoose, { Document } from 'mongoose';
export interface IAdView extends Document {
    user_uid: string;
    ad_id: mongoose.Types.ObjectId;
    tokens_earned: number;
    viewed_at: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=AdView.d.ts.map