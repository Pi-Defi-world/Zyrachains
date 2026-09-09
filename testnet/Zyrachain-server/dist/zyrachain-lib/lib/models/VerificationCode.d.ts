import mongoose, { Document } from 'mongoose';
export interface IVerificationCode extends Document {
    email: string;
    code: string;
    purpose: 'admin_login' | 'password_reset';
    attempts: number;
    maxAttempts: number;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=VerificationCode.d.ts.map