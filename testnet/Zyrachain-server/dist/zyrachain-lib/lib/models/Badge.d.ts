import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=Badge.d.ts.map