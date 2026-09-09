import mongoose from 'mongoose';
export interface IProjectListing {
    _id?: string;
    projectName: string;
    category: string;
    description: string;
    email: string;
    website?: string;
    piWalletAddress: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: Date;
    approvedAt?: Date;
    featured: boolean;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=ProjectListing.d.ts.map