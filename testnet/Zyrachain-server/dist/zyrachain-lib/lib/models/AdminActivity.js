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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const AdminActivitySchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.Mixed,
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
}, {
    timestamps: false,
});
AdminActivitySchema.index({ 'adminUser.username': 1, timestamp: -1 });
AdminActivitySchema.index({ actionType: 1, timestamp: -1 });
AdminActivitySchema.index({ targetType: 1, timestamp: -1 });
AdminActivitySchema.index({ timestamp: -1 });
AdminActivitySchema.index({ ipAddress: 1, timestamp: -1 });
AdminActivitySchema.statics.logActivity = async function (adminUser, action, actionType, targetType, ipAddress, options = {}) {
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
    }
    catch (error) {
        console.error('Failed to log admin activity:', error);
    }
};
exports.default = mongoose_1.default.models.AdminActivity || mongoose_1.default.model('AdminActivity', AdminActivitySchema);
//# sourceMappingURL=AdminActivity.js.map