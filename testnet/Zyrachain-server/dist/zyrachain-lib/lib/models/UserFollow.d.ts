import mongoose, { Document } from 'mongoose';
export interface IUserFollow extends Document {
    follower_uid: string;
    followed_uid: string;
    createdAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=UserFollow.d.ts.map