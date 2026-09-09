"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAdvertisingInquiry = exports.validateInfluencerListing = exports.validateCommunityListing = exports.validateProjectListing = exports.validateStartupListing = exports.validateBusinessListing = void 0;
const businessListingSchema = {
    name: 'string',
    category: 'string',
    description: 'string',
    city: 'string',
    country: 'string',
    email: 'string',
    website: 'string?',
    piWalletAddress: 'string?',
    acceptsPiPayments: 'boolean?',
    status: 'string?'
};
const startupListingSchema = {
    name: 'string',
    category: 'string',
    description: 'string',
    stage: 'string',
    email: 'string',
    website: 'string?',
    piWalletAddress: 'string?',
    status: 'string?'
};
const projectListingSchema = {
    projectName: 'string',
    category: 'string',
    description: 'string',
    email: 'string',
    website: 'string?',
    piWalletAddress: 'string',
    status: 'string?'
};
const communityListingSchema = {
    name: 'string',
    description: 'string',
    category: 'string',
    contactEmail: 'string',
    website: 'string?',
    telegram: 'string?',
    discord: 'string?',
    status: 'string?'
};
const influencerListingSchema = {
    name: 'string',
    bio: 'string',
    expertise: 'string',
    contactEmail: 'string',
    twitter: 'string?',
    youtube: 'string?',
    instagram: 'string?',
    status: 'string?'
};
const advertisingInquirySchema = {
    companyName: 'string',
    contactName: 'string',
    email: 'string',
    industry: 'string',
    campaignType: 'string',
    description: 'string?',
    planId: 'string',
    planName: 'string',
    amount: 'number',
    paymentId: 'string?',
    txid: 'string?',
    phone: 'string?',
    website: 'string?',
    targetAudience: 'string?',
    campaignGoals: 'string?',
    startDate: 'string?',
    duration: 'string?',
    additionalInfo: 'string?',
    status: 'string?',
    paymentStatus: 'string?'
};
function validateSchema(data, schema) {
    const errors = [];
    for (const [field, type] of Object.entries(schema)) {
        if (type.endsWith('?')) {
            continue;
        }
        if (!data.hasOwnProperty(field) || data[field] === undefined || data[field] === null) {
            errors.push(`Missing required field: ${field}`);
        }
    }
    for (const field in data) {
        if (!schema.hasOwnProperty(field) && !['_id', 'createdAt', 'updatedAt', 'submittedAt', 'approvedAt', 'featured'].includes(field)) {
            errors.push(`Field not allowed in simplified schema: ${field}`);
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
const validateBusinessListing = (req, res, next) => {
    const validation = validateSchema(req.body, businessListingSchema);
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            error: 'Invalid business listing data',
            details: validation.errors
        });
    }
    return next();
};
exports.validateBusinessListing = validateBusinessListing;
const validateStartupListing = (req, res, next) => {
    const validation = validateSchema(req.body, startupListingSchema);
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            error: 'Invalid startup listing data',
            details: validation.errors
        });
    }
    return next();
};
exports.validateStartupListing = validateStartupListing;
const validateProjectListing = (req, res, next) => {
    const validation = validateSchema(req.body, projectListingSchema);
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            error: 'Invalid project listing data',
            details: validation.errors
        });
    }
    return next();
};
exports.validateProjectListing = validateProjectListing;
const validateCommunityListing = (req, res, next) => {
    const validation = validateSchema(req.body, communityListingSchema);
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            error: 'Invalid community listing data',
            details: validation.errors
        });
    }
    return next();
};
exports.validateCommunityListing = validateCommunityListing;
const validateInfluencerListing = (req, res, next) => {
    const validation = validateSchema(req.body, influencerListingSchema);
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            error: 'Invalid influencer listing data',
            details: validation.errors
        });
    }
    return next();
};
exports.validateInfluencerListing = validateInfluencerListing;
const validateAdvertisingInquiry = (req, res, next) => {
    const validation = validateSchema(req.body, advertisingInquirySchema);
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            error: 'Invalid advertising inquiry data',
            details: validation.errors
        });
    }
    return next();
};
exports.validateAdvertisingInquiry = validateAdvertisingInquiry;
//# sourceMappingURL=listingValidation.js.map