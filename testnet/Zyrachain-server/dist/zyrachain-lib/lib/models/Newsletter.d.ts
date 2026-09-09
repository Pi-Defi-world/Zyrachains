import mongoose, { Document } from 'mongoose';
export interface INewsletter extends Document {
    email: string;
    isActive: boolean;
    subscribedAt: Date;
    unsubscribedAt?: Date;
    unsubscribeToken: string;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=Newsletter.d.ts.map