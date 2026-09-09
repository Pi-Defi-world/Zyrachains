import mongoose from 'mongoose';
export interface IBusinessListing {
    _id?: string;
    name: string;
    category: string;
    description: string;
    city: string;
    country: string;
    email: string;
    website?: string;
    piWalletAddress?: string;
    acceptsPiPayments: boolean;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: Date;
    approvedAt?: Date;
    featured: boolean;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=BusinessListing.d.ts.map