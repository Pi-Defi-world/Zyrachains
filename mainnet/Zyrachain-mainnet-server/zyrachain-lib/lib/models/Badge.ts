import mongoose, { Schema, Document } from 'mongoose';

export interface IBadge extends Document {
  badge_key: string;
  name: string;
  description: string;
  icon: string;
  category: 'follower_based' | 'paid' | 'achievement' | 'moderator' | 'special';
  criteria: Record<string, any>;
  price: number | null;
  tier: number;
  active: boolean;
  createdAt: Date;
}

const BadgeSchema: Schema = new Schema(
  {
    badge_key: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['follower_based', 'paid', 'achievement', 'moderator', 'special'],
      required: true,
    },
    criteria: {
      type: Schema.Types.Mixed,
      default: {},
    },
    price: {
      type: Number,
      default: null,
    },
    tier: {
      type: Number,
      default: 1,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

BadgeSchema.index({ category: 1, tier: 1 });
BadgeSchema.index({ badge_key: 1, active: 1 });

export default mongoose.models.Badge || mongoose.model<IBadge>('Badge', BadgeSchema);
