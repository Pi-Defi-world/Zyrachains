import mongoose, { Schema, Document } from 'mongoose';

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

const AdCampaignSchema: Schema = new Schema(
  {
    advertiser_uid: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    media_url: {
      type: String,
      default: '',
    },
    call_to_action: {
      type: String,
      default: 'Learn More',
    },
    target_url: {
      type: String,
      default: '',
    },
    reward_per_view: {
      type: Number,
      default: 0.5,
      min: 0,
    },
    total_budget: {
      type: Number,
      required: true,
    },
    tokens_spent: {
      type: Number,
      default: 0,
    },
    views_total: {
      type: Number,
      default: 0,
    },
    views_remaining: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    ad_source: {
      type: String,
      enum: ['pi_ads', 'google_ads', 'custom'],
      default: 'custom',
    },
    external_ad_id: {
      type: String,
      default: '',
    },
    priority: {
      type: Number,
      default: 0,
    },
    starts_at: {
      type: Date,
      default: Date.now,
    },
    expires_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

AdCampaignSchema.index({ active: 1, ad_source: 1, priority: -1 });
AdCampaignSchema.index({ advertiser_uid: 1 });
AdCampaignSchema.index({ starts_at: 1, expires_at: 1 });

export default mongoose.models.AdCampaign || mongoose.model<IAdCampaign>('AdCampaign', AdCampaignSchema);
