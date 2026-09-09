import { Document, Model } from 'mongoose';
export interface IRevenue extends Document {
    date: Date;
    source: 'pi_services' | 'usdt_services' | 'adsense' | 'pi_ads' | 'referrals' | 'listings' | 'other';
    amount: number;
    currency: 'PI' | 'USDT' | 'USD';
    description: string;
    transactionId?: string;
    userId?: string;
    metadata: any;
    verified: boolean;
    recordedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IRevenueModel extends Model<IRevenue> {
    getRevenueSummary(startDate?: Date, endDate?: Date, source?: string): Promise<any[]>;
    getDailyRevenue(startDate: Date, endDate: Date, currency?: string): Promise<any[]>;
}
declare const _default: IRevenueModel;
export default _default;
//# sourceMappingURL=Revenue.d.ts.map