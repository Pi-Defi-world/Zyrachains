import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    user_uid: string;
    piUsername?: string;
    from_address?: string;
    to_address?: string;
    role: 'admin' | 'editor' | 'author' | 'reader';
    avatar?: string;
    bio?: string;
    piAccessToken?: string;
    piAuthenticatedAt?: Date;
    piAppId?: string;
    piCredentials?: {
        scopes: string[];
        valid_until: {
            timestamp: number;
            iso8601: string;
        };
    };
    piReceivingEmail?: boolean;
    referred_by?: string;
    referred_at?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map