import mongoose, { Document } from 'mongoose';
export interface IApiKey extends Document {
    keyHash: string;
    keyPrefix: string;
    userId: mongoose.Types.ObjectId;
    piUid?: string;
    name: string;
    paymentId: string;
    transactionId?: string;
    status: 'active' | 'revoked' | 'expired';
    rateLimit: {
        requestsPerMinute: number;
        requestsPerDay: number;
    };
    usage: {
        totalRequests: number;
        lastUsedAt?: Date;
    };
    credits: number;
    creditCostPerRequest: number;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=ApiKey.d.ts.map