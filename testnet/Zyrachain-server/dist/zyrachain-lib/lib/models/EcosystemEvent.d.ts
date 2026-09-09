import mongoose, { Document } from 'mongoose';
export interface IEcosystemEvent extends Document {
    title: string;
    description: string;
    date: Date;
    location: string;
    type: 'upcoming' | 'past';
    link?: string;
    organizer?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=EcosystemEvent.d.ts.map