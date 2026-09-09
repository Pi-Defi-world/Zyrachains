import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdminActivity extends Document {
  adminUser: {
    username: string;
    email: string;
    role: string;
  };
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'config';
  targetType: 'user' | 'blog_post' | 'ip_address' | 'system' | 'auth';
  targetId?: string;
  targetName?: string;
  details: any;
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export interface IAdminActivityModel extends Model<IAdminActivity> {
  logActivity(
    adminUser: { username: string; email: string; role: string },
    action: string,
    actionType: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'config',
    targetType: 'user' | 'blog_post' | 'ip_address' | 'system' | 'auth',
    ipAddress: string,
    options?: {
      targetId?: string;
      targetName?: string;
      details?: any;
      userAgent?: string;
      success?: boolean;
      errorMessage?: string;
    }
  ): Promise<IAdminActivity | void>;
}

const AdminActivitySchema: Schema = new Schema(
  {
    adminUser: {
      username: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        required: true,
      },
    },
    action: {
      type: String,
      required: [true, 'Action description is required'],
      maxlength: 500,
    },
    actionType: {
      type: String,
      enum: ['create', 'update', 'delete', 'view', 'login', 'logout', 'config'],
      required: [true, 'Action type is required'],
    },
    targetType: {
      type: String,
      enum: ['user', 'blog_post', 'ip_address', 'system', 'auth'],
      required: [true, 'Target type is required'],
    },
    targetId: {
      type: String,
      required: false,
    },
    targetName: {
      type: String,
      required: false,
      maxlength: 200,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
    },
    userAgent: {
      type: String,
      required: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
      required: false,
      maxlength: 1000,
    },
  },
  {
    timestamps: false, // We're using our own timestamp field
  }
);

// Create indexes for efficient querying
AdminActivitySchema.index({ 'adminUser.username': 1, timestamp: -1 });
AdminActivitySchema.index({ actionType: 1, timestamp: -1 });
AdminActivitySchema.index({ targetType: 1, timestamp: -1 });
AdminActivitySchema.index({ timestamp: -1 });
AdminActivitySchema.index({ ipAddress: 1, timestamp: -1 });

// Helper method to log activity
AdminActivitySchema.statics.logActivity = async function(
  adminUser: { username: string; email: string; role: string },
  action: string,
  actionType: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'config',
  targetType: 'user' | 'blog_post' | 'ip_address' | 'system' | 'auth',
  ipAddress: string,
  options: {
    targetId?: string;
    targetName?: string;
    details?: any;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
  } = {}
) {
  try {
    const activity = new this({
      adminUser,
      action,
      actionType,
      targetType,
      ipAddress,
      ...options,
    });
    
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Failed to log admin activity:', error);
    // Don't throw error - logging failure shouldn't break the main operation
  }
};

export default (mongoose.models.AdminActivity as IAdminActivityModel) || mongoose.model<IAdminActivity, IAdminActivityModel>('AdminActivity', AdminActivitySchema); 