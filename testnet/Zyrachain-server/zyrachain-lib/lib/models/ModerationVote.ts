import mongoose, { Schema, Document } from 'mongoose';

export interface IModerationVote extends Document {
  post_uid: mongoose.Types.ObjectId;
  moderator_uid: string;
  vote: 'flag' | 'approve' | 'abstain';
  token_staked: number;
  reason: string;
  resolved: boolean;
  resolution: 'win' | 'loss' | null;
  resolved_at: Date | null;
  createdAt: Date;
}

const ModerationVoteSchema: Schema = new Schema(
  {
    post_uid: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    moderator_uid: {
      type: String,
      required: true,
    },
    vote: {
      type: String,
      enum: ['flag', 'approve', 'abstain'],
      required: true,
    },
    token_staked: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      maxlength: 500,
      default: '',
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolution: {
      type: String,
      enum: ['win', 'loss', null],
      default: null,
    },
    resolved_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ModerationVoteSchema.index({ post_uid: 1, moderator_uid: 1 }, { unique: true });
ModerationVoteSchema.index({ post_uid: 1, resolved: 1 });
ModerationVoteSchema.index({ moderator_uid: 1, createdAt: -1 });

export default mongoose.models.ModerationVote || mongoose.model<IModerationVote>('ModerationVote', ModerationVoteSchema);
