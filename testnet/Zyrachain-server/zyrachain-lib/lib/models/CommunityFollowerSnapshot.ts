import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunityFollowerSnapshot extends Document {
  handle: string;
  name: string;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  fetchedAt: Date;
}

const CommunityFollowerSnapshotSchema = new Schema<ICommunityFollowerSnapshot>({
  handle: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  followersCount: {
    type: Number,
    required: true,
    default: 0,
  },
  followingCount: {
    type: Number,
    default: 0,
  },
  tweetCount: {
    type: Number,
    default: 0,
  },
  fetchedAt: {
    type: Date,
    default: () => new Date(),
    index: true,
  },
});

CommunityFollowerSnapshotSchema.index({ handle: 1, fetchedAt: -1 });

export default mongoose.models.CommunityFollowerSnapshot ||
  mongoose.model<ICommunityFollowerSnapshot>(
    'CommunityFollowerSnapshot',
    CommunityFollowerSnapshotSchema
  );
