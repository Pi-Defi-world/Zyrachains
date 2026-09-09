import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  postId: mongoose.Types.ObjectId;
  author: {
    name: string;
    email: string;
    website?: string;
  };
  content: string;
  status: 'pending' | 'approved' | 'spam' | 'rejected';
  parentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'BlogPost',
      required: [true, 'Post ID is required'],
    },
    author: {
      name: {
        type: String,
        required: [true, 'Author name is required'],
        trim: true,
        maxlength: [50, 'Author name cannot exceed 50 characters'],
      },
      email: {
        type: String,
        required: [true, 'Author email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
      },
      website: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please provide a valid URL'],
      },
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'spam', 'rejected'],
      default: 'pending',
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
CommentSchema.index({ postId: 1, status: 1, createdAt: -1 });
CommentSchema.index({ status: 1 });
CommentSchema.index({ 'author.email': 1 });
CommentSchema.index({ parentId: 1 });

// Pre-save middleware for spam detection (basic implementation)
CommentSchema.pre<IComment>('save', function (next) {
  // Basic spam detection - check for common spam patterns
  const spamPatterns = [
    /viagra/i,
    /casino/i,
    /lottery/i,
    /click here/i,
    /http[s]?:\/\/[^\s]+/g, // Multiple URLs
  ];
  
  let urlCount = 0;
  const urls = this.content.match(/http[s]?:\/\/[^\s]+/g);
  if (urls) {
    urlCount = urls.length;
  }
  
  // Mark as spam if contains spam patterns or too many URLs
  if (spamPatterns.some(pattern => pattern.test(this.content)) || urlCount > 2) {
    this.status = 'spam';
  }
  
  next();
});

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema); 