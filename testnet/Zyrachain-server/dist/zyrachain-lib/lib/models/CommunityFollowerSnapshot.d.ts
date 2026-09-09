import mongoose, { Document } from 'mongoose';
export interface ICommunityFollowerSnapshot extends Document {
    handle: string;
    name: string;
    followersCount: number;
    followingCount: number;
    tweetCount: number;
    fetchedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=CommunityFollowerSnapshot.d.ts.map