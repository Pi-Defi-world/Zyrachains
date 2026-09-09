import mongoose, { Document } from 'mongoose';
export interface IEcosystemCommunity extends Document {
    name: string;
    description: string;
    category: string;
    link: string;
    country?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=EcosystemCommunity.d.ts.map