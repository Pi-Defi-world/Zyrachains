import mongoose from 'mongoose';
export interface IInfluencerListing {
    _id?: string;
    name: string;
    bio: string;
    expertise: string;
    contactEmail: string;
    twitter?: string;
    youtube?: string;
    instagram?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=InfluencerListing.d.ts.map