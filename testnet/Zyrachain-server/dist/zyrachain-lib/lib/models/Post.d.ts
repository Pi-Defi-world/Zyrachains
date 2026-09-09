import mongoose, { Document } from 'mongoose';
export interface IPost extends Document {
    author_uid: string;
    content: string;
    images: string[];
    content_type: 'post' | 'comment';
    parent_id: mongoose.Types.ObjectId | null;
    token_cost: number;
    tips_received: number;
    impression_count: number;
    like_count: number;
    dislike_count: number;
    reshare_count: number;
    comment_count: number;
    is_boosted: boolean;
    boost_amount: number;
    boost_expires_at: Date | null;
    status: 'active' | 'flagged' | 'moderated' | 'removed';
    tags: string[];
    visibility: 'public' | 'followers_only';
    trending_score: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=Post.d.ts.map