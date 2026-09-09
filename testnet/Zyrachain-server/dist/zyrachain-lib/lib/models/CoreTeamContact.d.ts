import mongoose from 'mongoose';
export interface ICoreTeamContact {
    _id?: string;
    contactInfo: {
        name: string;
        email: string;
        organization?: string;
        role: string;
    };
    inquiry: {
        category: string;
        priority: 'low' | 'medium' | 'high' | 'urgent';
        subject: string;
        details: string;
    };
    projectInfo?: {
        name: string;
        stage: string;
        piIntegration: string;
        website?: string;
    };
    status: 'new' | 'in_progress' | 'responded' | 'resolved' | 'closed';
    submittedAt: Date;
    respondedAt?: Date;
    resolvedAt?: Date;
    assignedTo?: string;
    response?: string;
    internalNotes?: string;
    followUpRequired: boolean;
    expectedResponseTime: number;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any>;
export default _default;
//# sourceMappingURL=CoreTeamContact.d.ts.map