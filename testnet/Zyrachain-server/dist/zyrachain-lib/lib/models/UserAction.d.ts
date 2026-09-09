import mongoose, { Document } from 'mongoose';
export type ActionType = 'like' | 'dislike' | 'tip' | 'reshare' | 'boost' | 'report';
export interface IUserAction extends Document {
    user_uid: string;
    post_uid: mongoose.Types.ObjectId;
    action_type: ActionType;
    token_amount: number | null;
    metadata: Record<string, any>;
    createdAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=UserAction.d.ts.map