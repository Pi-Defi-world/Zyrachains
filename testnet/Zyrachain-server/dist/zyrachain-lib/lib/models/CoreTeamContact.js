"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const CoreTeamContactSchema = new mongoose_1.default.Schema({
    contactInfo: {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            validate: {
                validator: function (v) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                },
                message: 'Invalid email format'
            }
        },
        organization: {
            type: String,
            trim: true,
            maxlength: 200
        },
        role: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        }
    },
    inquiry: {
        category: {
            type: String,
            required: true,
            enum: [
                'Partnership Proposal',
                'Integration Support',
                'Technical Collaboration',
                'Business Development',
                'Ecosystem Proposal',
                'Media & Press',
                'Academic Research',
                'Security Issues',
                'Strategic Alliance'
            ]
        },
        priority: {
            type: String,
            required: true,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        },
        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        details: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000
        }
    },
    projectInfo: {
        name: {
            type: String,
            trim: true,
            maxlength: 100
        },
        stage: {
            type: String,
            trim: true,
            maxlength: 50
        },
        piIntegration: {
            type: String,
            trim: true,
            maxlength: 200
        },
        website: {
            type: String,
            trim: true
        }
    },
    status: {
        type: String,
        required: true,
        enum: ['new', 'in_progress', 'responded', 'resolved', 'closed'],
        default: 'new'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    respondedAt: {
        type: Date
    },
    resolvedAt: {
        type: Date
    },
    assignedTo: {
        type: String,
        trim: true
    },
    response: {
        type: String,
        trim: true
    },
    internalNotes: {
        type: String,
        trim: true
    },
    followUpRequired: {
        type: Boolean,
        default: false
    },
    expectedResponseTime: {
        type: Number,
        required: true,
        default: function () {
            switch (this.inquiry?.priority) {
                case 'urgent': return 4;
                case 'high': return 24;
                case 'medium': return 72;
                case 'low': return 168;
                default: return 72;
            }
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
CoreTeamContactSchema.index({ 'contactInfo.email': 1 });
CoreTeamContactSchema.index({ 'inquiry.category': 1 });
CoreTeamContactSchema.index({ 'inquiry.priority': 1 });
CoreTeamContactSchema.index({ status: 1 });
CoreTeamContactSchema.index({ submittedAt: -1 });
CoreTeamContactSchema.index({ assignedTo: 1 });
CoreTeamContactSchema.virtual('isOverdue').get(function () {
    if (this.status === 'resolved' || this.status === 'closed')
        return false;
    const now = new Date();
    const deadlineTime = this.submittedAt.getTime() + (this.expectedResponseTime * 60 * 60 * 1000);
    return now.getTime() > deadlineTime;
});
exports.default = mongoose_1.default.models.CoreTeamContact || mongoose_1.default.model('CoreTeamContact', CoreTeamContactSchema);
//# sourceMappingURL=CoreTeamContact.js.map