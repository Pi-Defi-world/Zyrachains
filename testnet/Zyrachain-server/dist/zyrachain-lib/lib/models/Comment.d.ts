import mongoose, { Document } from 'mongoose';
export interface IComment extends Document {
    postId: mongoose.Types.ObjectId;
    author: {
        name: string;
        email: string;
        website?: string;
    };
    content: string;
    status: 'pending' | 'approved' | 'spam' | 'rejected';
    parentId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=Comment.d.ts.map