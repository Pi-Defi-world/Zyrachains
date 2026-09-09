import mongoose, { Schema, Document } from 'mongoose';

export interface IAdView extends Document {
  user_uid: string;
  ad_id: mongoose.Types.ObjectId;
  tokens_earned: number;
  viewed_at: Date;
}

const AdViewSchema: Schema = new Schema(
  {
    user_uid: {
      type: String,
      required: true,
    },
    ad_id: {
      type: Schema.Types.ObjectId,
      ref: 'AdCampaign',
      required: true,
    },
    tokens_earned: {
      type: Number,
      required: true,
    },
    viewed_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

AdViewSchema.index({ user_uid: 1, ad_id: 1 }, { unique: true });
AdViewSchema.index({ user_uid: 1, viewed_at: -1 });
AdViewSchema.index({ ad_id: 1 });
AdViewSchema.index({ viewed_at: -1 });

export default mongoose.models.AdView || mongoose.model<IAdView>('AdView', AdViewSchema);
