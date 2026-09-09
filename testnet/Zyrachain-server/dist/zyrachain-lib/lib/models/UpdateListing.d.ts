import mongoose from 'mongoose';
export interface IUpdateListing {
    _id?: string;
    projectName: string;
    email: string;
    updatedInfo: {
        description?: string;
        website?: string;
        piWalletAddress?: string;
    };
    changeReason: string;
    status: 'pending' | 'approved' | 'rejected';
    paymentId?: string;
    transactionId?: string;
    paidAt?: Date;
    submittedAt: Date;
    processedAt?: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=UpdateListing.d.ts.map