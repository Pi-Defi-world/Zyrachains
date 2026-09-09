import mongoose from 'mongoose';
export interface ICommunityListing {
    _id?: string;
    name: string;
    description: string;
    category: string;
    contactEmail: string;
    website?: string;
    telegram?: string;
    twitter?: string;
    discord?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=CommunityListing.d.ts.map