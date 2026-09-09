import mongoose, { Document } from 'mongoose';
export type AdSource = 'pi_ads' | 'google_ads' | 'custom';
export interface IAdCampaign extends Document {
    advertiser_uid: string | null;
    title: string;
    content: string;
    media_url: string;
    call_to_action: string;
    target_url: string;
    reward_per_view: number;
    total_budget: number;
    tokens_spent: number;
    views_total: number;
    views_remaining: number;
    active: boolean;
    ad_source: AdSource;
    external_ad_id: string;
    priority: number;
    starts_at: Date;
    expires_at: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=AdCampaign.d.ts.map