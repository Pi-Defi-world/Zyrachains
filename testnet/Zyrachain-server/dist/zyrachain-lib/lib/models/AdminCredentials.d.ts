import mongoose, { Document } from 'mongoose';
export interface IAdminCredentials extends Document {
    username: string;
    email: string;
    password: string;
    role: 'super_admin' | 'admin' | 'editor_admin';
    permissions: string[];
    isActive: boolean;
    lastLoginAt?: Date;
    lastLoginIP?: string;
    failedAttempts: number;
    lockedUntil?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=AdminCredentials.d.ts.map