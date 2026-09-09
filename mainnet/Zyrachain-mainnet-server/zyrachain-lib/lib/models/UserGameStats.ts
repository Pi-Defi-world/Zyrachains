import mongoose, { Schema, Document } from 'mongoose';

export interface IUserGameStats extends Document {
  user_uid: string;
  xp: number;
  level: number;
  streak_days: number;
  last_active_date: Date | null;
  weekly_xp: number;
  weekly_reset_at: Date;
  total_missions_completed: number;
  total_posts: number;
  total_likes_received: number;
  total_tips_received: number;
  updatedAt: Date;
}

const UserGameStatsSchema: Schema = new Schema(
  {
    user_uid: {
      type: String,
      required: true,
      unique: true,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 50,
    },
    streak_days: {
      type: Number,
      default: 0,
      min: 0,
    },
    last_active_date: {
      type: Date,
      default: null,
    },
    weekly_xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    weekly_reset_at: {
      type: Date,
      default: () => {
        const now = new Date();
        now.setUTCHours(0, 0, 0, 0);
        const day = now.getUTCDay();
        const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
        now.setUTCDate(diff);
        return now;
      },
    },
    total_missions_completed: {
      type: Number,
      default: 0,
    },
    total_posts: {
      type: Number,
      default: 0,
    },
    total_likes_received: {
      type: Number,
      default: 0,
    },
    total_tips_received: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

UserGameStatsSchema.index({ weekly_xp: -1 });
UserGameStatsSchema.index({ level: -1, xp: -1 });

export default mongoose.models.UserGameStats || mongoose.model<IUserGameStats>('UserGameStats', UserGameStatsSchema);
