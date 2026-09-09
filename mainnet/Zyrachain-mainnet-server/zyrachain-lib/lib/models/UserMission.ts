import mongoose, { Schema, Document } from 'mongoose';

export interface IUserMission extends Document {
  user_uid: string;
  mission_date: Date;
  missions: Array<{
    mission_key: string;
    progress: number;
    target: number;
    completed: boolean;
    claimed: boolean;
    reward: number;
  }>;
}

const MissionItemSchema = new Schema(
  {
    mission_key: { type: String, required: true },
    progress: { type: Number, default: 0 },
    target: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    claimed: { type: Boolean, default: false },
    reward: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserMissionSchema: Schema = new Schema(
  {
    user_uid: {
      type: String,
      required: true,
    },
    mission_date: {
      type: Date,
      required: true,
    },
    missions: {
      type: [MissionItemSchema],
      default: [],
    },
  },
  { timestamps: false }
);

UserMissionSchema.index({ user_uid: 1, mission_date: 1 }, { unique: true });

export default mongoose.models.UserMission || mongoose.model<IUserMission>('UserMission', UserMissionSchema);
