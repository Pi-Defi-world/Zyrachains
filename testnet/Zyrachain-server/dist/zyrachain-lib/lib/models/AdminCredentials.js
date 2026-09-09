"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const AdminCredentialsSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
});
AdminCredentialsSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcryptjs_1.default.genSalt(12);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
AdminCredentialsSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcryptjs_1.default.compare(candidatePassword, this.password);
    }
    catch (error) {
        throw error;
    }
};
AdminCredentialsSchema.methods.isLocked = function () {
    return !!(this.lockedUntil && this.lockedUntil > Date.now());
};
AdminCredentialsSchema.methods.incFailedAttempts = async function () {
    if (this.lockedUntil && this.lockedUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockedUntil: 1 },
            $set: { failedAttempts: 1 }
        });
    }
    const updates = { $inc: { failedAttempts: 1 } };
    if (this.failedAttempts + 1 >= 5 && !this.isLocked()) {
        updates.$set = { lockedUntil: Date.now() + 2 * 60 * 60 * 1000 };
    }
    return this.updateOne(updates);
};
AdminCredentialsSchema.methods.resetFailedAttempts = async function () {
    return this.updateOne({
        $unset: { failedAttempts: 1, lockedUntil: 1 }
    });
};
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
AdminCredentialsSchema.pre('save', function (next) {
    if (this.isNew || this.isModified('role')) {
        this.permissions = ROLE_PERMISSIONS[this.role] || [];
    }
    next();
});
exports.default = mongoose_1.default.models.AdminCredentials || mongoose_1.default.model('AdminCredentials', AdminCredentialsSchema);
//# sourceMappingURL=AdminCredentials.js.map