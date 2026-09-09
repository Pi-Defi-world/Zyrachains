import mongoose from 'mongoose';
export declare function roundZP(amount: number): number;
export declare function platformFee(amount: number): Promise<number>;
export declare function creatorShare(amount: number): Promise<number>;
export declare function getOrCreateTokenAccount(userUID: string): Promise<any>;
export declare function getBalance(userUID: string): Promise<number>;
export declare function getTokenAccount(userUID: string): Promise<any>;
export declare function creditZP(userUID: string, amount: number, txType: string, subType: string, refId?: mongoose.Types.ObjectId | null, refModel?: string, metadata?: Record<string, any>): Promise<{
    account: any;
    tx: any;
}>;
export declare function debitZP(userUID: string, amount: number, txType: string, refId?: mongoose.Types.ObjectId | null, refModel?: string, metadata?: Record<string, any>): Promise<{
    account: any;
    tx: any;
}>;
export declare function transferZP(fromUID: string, toUID: string, amount: number, txType: string, refId?: mongoose.Types.ObjectId | null, refModel?: string, metadata?: Record<string, any>): Promise<{
    fromAccount: any;
    toAccount: any;
    tx: any;
}>;
export declare function getTransactionHistory(userUID: string, page?: number, limit?: number): Promise<{
    transactions: any[];
    total: number;
}>;
export declare function purchaseZP(userUID: string, piAmount: number, paymentId: string, txid: string): Promise<{
    account: any;
    zpAmount: number;
}>;
//# sourceMappingURL=token-ledger.d.ts.map