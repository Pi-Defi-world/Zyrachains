import mongoose, { Document } from 'mongoose';
export interface IReferral extends Document {
    referrer_uid: string;
    referrer_username: string;
    referred_uid: string;
    referred_username: string;
    reward_zp: number;
    status: 'rewarded' | 'pending';
    createdAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=Referral.d.ts.map