import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  author_uid: string;
  content: string;
  images: string[];
  content_type: 'post' | 'comment';
  parent_id: mongoose.Types.ObjectId | null;
  token_cost: number;
  tips_received: number;
  impression_count: number;
  like_count: number;
  dislike_count: number;
  reshare_count: number;
  comment_count: number;
  is_boosted: boolean;
  boost_amount: number;
  boost_expires_at: Date | null;
  status: 'active' | 'flagged' | 'moderated' | 'removed';
  tags: string[];
  visibility: 'public' | 'followers_only';
  trending_score: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema(
  {
    author_uid: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
      validate: [(v: string[]) => v.length <= 10, 'Maximum 10 images per post'],
    },
    content_type: {
      type: String,
      enum: ['post', 'comment'],
      default: 'post',
    },
    parent_id: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    token_cost: {
      type: Number,
      default: 0,
    },
    tips_received: {
      type: Number,
      default: 0,
    },
    impression_count: {
      type: Number,
      default: 0,
    },
    like_count: {
      type: Number,
      default: 0,
    },
    dislike_count: {
      type: Number,
      default: 0,
    },
    reshare_count: {
      type: Number,
      default: 0,
    },
    comment_count: {
      type: Number,
      default: 0,
    },
    is_boosted: {
      type: Boolean,
      default: false,
    },
    boost_amount: {
      type: Number,
      default: 0,
    },
    boost_expires_at: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'flagged', 'moderated', 'removed'],
      default: 'active',
    },
    tags: {
      type: [String],
      default: [],
    },
    visibility: {
      type: String,
      enum: ['public', 'followers_only'],
      default: 'public',
    },
    trending_score: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

PostSchema.index({ content_type: 1, status: 1, createdAt: -1 });
PostSchema.index({ content_type: 1, status: 1, trending_score: -1, createdAt: -1 });
PostSchema.index({ author_uid: 1, createdAt: -1 });
PostSchema.index({ status: 1, is_boosted: 1, boost_expires_at: 1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ content: 'text', tags: 'text' });
PostSchema.index({ parent_id: 1, createdAt: -1 });

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
