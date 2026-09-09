import mongoose from 'mongoose';
export interface IStartupListing {
    _id?: string;
    name: string;
    category: string;
    description: string;
    stage: string;
    email: string;
    website?: string;
    piWalletAddress?: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: Date;
    approvedAt?: Date;
    featured: boolean;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=StartupListing.d.ts.map