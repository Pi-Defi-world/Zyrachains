import mongoose, { Document } from 'mongoose';
export interface IUserMission extends Document {
    user_uid: string;
    mission_date: Date;
    missions: Array<{
        mission_key: string;
        progress: number;
        target: number;
        completed: boolean;
        claimed: boolean;
        reward: number;
    }>;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=UserMission.d.ts.map