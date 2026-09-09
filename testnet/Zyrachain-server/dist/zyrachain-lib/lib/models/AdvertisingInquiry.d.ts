import mongoose, { Document } from 'mongoose';
export interface IAdvertisingInquiry extends Document {
    companyName: string;
    contactName: string;
    email: string;
    industry: string;
    budget: string;
    campaignType: string;
    description?: string;
    status: 'pending' | 'reviewed' | 'contacted' | 'converted' | 'rejected';
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IAdvertisingInquiry, {}, {}, {}, mongoose.Document<unknown, {}, IAdvertisingInquiry, {}> & IAdvertisingInquiry & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=AdvertisingInquiry.d.ts.map