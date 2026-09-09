import { Document, Model } from 'mongoose';
export interface IAdminActivity extends Document {
    adminUser: {
        username: string;
        email: string;
        role: string;
    };
    action: string;
    actionType: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'config';
    targetType: 'user' | 'blog_post' | 'ip_address' | 'system' | 'auth';
    targetId?: string;
    targetName?: string;
    details: any;
    ipAddress: string;
    userAgent?: string;
    timestamp: Date;
    success: boolean;
    errorMessage?: string;
}
export interface IAdminActivityModel extends Model<IAdminActivity> {
    logActivity(adminUser: {
        username: string;
        email: string;
        role: string;
    }, action: string, actionType: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'config', targetType: 'user' | 'blog_post' | 'ip_address' | 'system' | 'auth', ipAddress: string, options?: {
        targetId?: string;
        targetName?: string;
        details?: any;
        userAgent?: string;
        success?: boolean;
        errorMessage?: string;
    }): Promise<IAdminActivity | void>;
}
declare const _default: IAdminActivityModel;
export default _default;
//# sourceMappingURL=AdminActivity.d.ts.map