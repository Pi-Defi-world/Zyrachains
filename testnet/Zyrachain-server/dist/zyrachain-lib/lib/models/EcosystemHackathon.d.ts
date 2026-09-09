import mongoose, { Document } from 'mongoose';
export interface IEcosystemHackathon extends Document {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    prize: string;
    participants?: number;
    status: 'upcoming' | 'ongoing' | 'ended';
    link?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=EcosystemHackathon.d.ts.map