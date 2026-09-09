import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdminCredentials extends Document {
  username: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'editor_admin';
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: Date;
  lastLoginIP?: string;
  failedAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AdminCredentialsSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'editor_admin'],
      default: 'admin',
      required: true,
    },
    permissions: [{
      type: String,
      enum: [
        'manage_users',
        'manage_blog',
        'manage_ip_addresses',
        'view_analytics',
        'view_activity_logs',
        'manage_system_settings',
        'manage_revenue',
        'create_admins',
        'delete_users',
        'manage_permissions'
      ],
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLoginIP: {
      type: String,
      default: null,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
AdminCredentialsSchema.pre<IAdminCredentials>('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
AdminCredentialsSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Check if account is locked
AdminCredentialsSchema.methods.isLocked = function(): boolean {
  return !!(this.lockedUntil && this.lockedUntil > Date.now());
};

// Increment failed attempts and lock if necessary
AdminCredentialsSchema.methods.incFailedAttempts = async function(): Promise<void> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockedUntil && this.lockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockedUntil: 1 },
      $set: { failedAttempts: 1 }
    });
  }
  
  const updates: any = { $inc: { failedAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.failedAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockedUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Reset failed attempts
AdminCredentialsSchema.methods.resetFailedAttempts = async function(): Promise<void> {
  return this.updateOne({
    $unset: { failedAttempts: 1, lockedUntil: 1 }
  });
};

// Define role permissions
const ROLE_PERMISSIONS = {
  super_admin: [
    'manage_users',
    'manage_blog',
    'manage_ip_addresses',
    'view_analytics',
    'view_activity_logs',
    'manage_system_settings',
    'manage_revenue',
    'create_admins',
    'delete_users',
    'manage_permissions'
  ],
  admin: [
    'manage_users',
    'manage_blog',
    'manage_ip_addresses',
    'view_analytics',
    'view_activity_logs',
    'manage_system_settings',
    'manage_revenue'
  ],
  editor_admin: [
    'manage_blog',
    'view_analytics',
    'view_activity_logs'
  ]
};

// Set default permissions based on role
AdminCredentialsSchema.pre<IAdminCredentials>('save', function(next) {
  if (this.isNew || this.isModified('role')) {
    this.permissions = ROLE_PERMISSIONS[this.role] || [];
  }
  next();
});

export default mongoose.models.AdminCredentials || mongoose.model<IAdminCredentials>('AdminCredentials', AdminCredentialsSchema); 