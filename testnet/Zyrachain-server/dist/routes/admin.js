"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AdminCredentials_1 = __importDefault(require("../zyrachain-lib/lib/models/AdminCredentials"));
const AdminActivity_1 = __importDefault(require("../zyrachain-lib/lib/models/AdminActivity"));
const VerificationCode_1 = __importDefault(require("../zyrachain-lib/lib/models/VerificationCode"));
const User_1 = __importDefault(require("../zyrachain-lib/lib/models/User"));
const EcosystemCommunity_1 = __importDefault(require("../zyrachain-lib/lib/models/EcosystemCommunity"));
const BusinessListing_1 = __importDefault(require("../zyrachain-lib/lib/models/BusinessListing"));
const StartupListing_1 = __importDefault(require("../zyrachain-lib/lib/models/StartupListing"));
const CommunityListing_1 = __importDefault(require("../zyrachain-lib/lib/models/CommunityListing"));
const InfluencerListing_1 = __importDefault(require("../zyrachain-lib/lib/models/InfluencerListing"));
const OTP_1 = __importDefault(require("../zyrachain-lib/lib/models/OTP"));
const Post_1 = __importDefault(require("../zyrachain-lib/lib/models/Post"));
const auth_1 = require("../middleware/auth");
const email_service_1 = require("../zyrachain-lib/lib/email-service");
const mongoose_1 = __importDefault(require("mongoose"));
const pi_config_1 = require("../zyrachain-lib/config/pi-config");
const pct_balance_scanner_1 = require("../services/pct-balance-scanner");
const pct_summary_1 = require("../services/pct-summary");
const platform_settings_1 = require("../services/platform-settings");
const router = express_1.default.Router();
router.post('/auth', async (req, res) => {
    try {
        const { email, role, otp } = req.body;
        const clientIP = req.headers['x-client-ip'] || req.ip || 'unknown';
        console.log('🔐 Admin auth request:', { email, role, hasOTP: !!otp });
        if (!otp) {
            if (!email || !role) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and role are required'
                });
            }
            if (!(0, email_service_1.isValidAdminEmail)(email)) {
                console.log('❌ Invalid admin email:', email);
                return res.status(401).json({
                    success: false,
                    message: 'Email not authorized for admin access'
                });
            }
            const validRoles = ['super_admin', 'admin', 'moderator'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role. Must be: super_admin, admin, or moderator'
                });
            }
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            await OTP_1.default.create({
                email: email.toLowerCase(),
                otp: otpCode,
                role,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            });
            await (0, email_service_1.sendOTPEmail)(email, otpCode, role);
            try {
                await AdminActivity_1.default.create({
                    adminUser: {
                        username: email.split('@')[0],
                        email: email.toLowerCase(),
                        role: role
                    },
                    action: 'OTP requested for admin login',
                    actionType: 'login',
                    targetType: 'auth',
                    details: { email, role },
                    ipAddress: clientIP,
                    success: true
                });
            }
            catch (logError) {
                console.warn('Failed to log admin activity:', logError);
            }
            return res.json({
                success: true,
                message: 'OTP sent to your email',
                requiresOTP: true
            });
        }
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }
        const otpRecord = await OTP_1.default.findOne({
            email: email.toLowerCase(),
            otp,
            used: false,
            expiresAt: { $gt: new Date() }
        });
        if (!otpRecord) {
            console.log('❌ Invalid or expired OTP for:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }
        otpRecord.used = true;
        await otpRecord.save();
        let admin = await AdminCredentials_1.default.findOne({ email: email.toLowerCase() });
        if (!admin) {
            const securePassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
            admin = await AdminCredentials_1.default.create({
                email: email.toLowerCase(),
                username: email.split('@')[0],
                password: securePassword,
                role: otpRecord.role,
                isActive: true,
                permissions: getDefaultPermissions(otpRecord.role)
            });
        }
        else {
            admin.role = otpRecord.role;
            admin.permissions = getDefaultPermissions(otpRecord.role);
            admin.lastLoginAt = new Date();
            await admin.save();
        }
        const token = jsonwebtoken_1.default.sign({
            adminId: admin._id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions
        }, process.env.JWT_SECRET || 'admin-secret', { expiresIn: '24h' });
        try {
            await AdminActivity_1.default.create({
                adminUser: {
                    username: admin.username,
                    email: admin.email,
                    role: admin.role
                },
                action: 'Admin login successful via OTP',
                actionType: 'login',
                targetType: 'auth',
                details: { email, role: otpRecord.role },
                ipAddress: clientIP,
                success: true
            });
        }
        catch (logError) {
            console.warn('Failed to log admin activity:', logError);
        }
        console.log('✅ Admin login successful:', email);
        return res.json({
            success: true,
            token,
            user: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions
            }
        });
    }
    catch (error) {
        console.error('Admin auth error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
function getDefaultPermissions(role) {
    switch (role) {
        case 'super_admin':
            return [
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
            ];
        case 'admin':
            return [
                'manage_users',
                'manage_blog',
                'manage_ip_addresses',
                'view_analytics',
                'view_activity_logs',
                'manage_system_settings',
                'manage_revenue'
            ];
        case 'editor_admin':
            return [
                'manage_blog',
                'view_analytics',
                'view_activity_logs'
            ];
        default:
            return [];
    }
}
router.get('/auth', async (req, res) => {
    const clientIP = req.headers['x-client-ip'] || req.ip || 'unknown';
    return res.json({
        success: true,
        allowedIP: true,
        clientIP
    });
});
router.get('/auth/check', auth_1.authenticateAdmin, async (req, res) => {
    try {
        if (!req.adminUser) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }
        return res.json({
            success: true,
            user: {
                id: req.adminUser.adminId,
                username: req.adminUser.username,
                email: req.adminUser.email,
                role: req.adminUser.role,
                permissions: req.adminUser.permissions
            }
        });
    }
    catch (error) {
        console.error('Auth check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication check failed'
        });
    }
});
router.post('/auth/advanced', async (req, res) => {
    try {
        const { action, email, password, verificationCode } = req.body;
        if (action === 'login') {
            const admin = await AdminCredentials_1.default.findOne({ email, isActive: true });
            if (!admin) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            const isPasswordValid = await bcryptjs_1.default.compare(password, admin.password);
            if (!isPasswordValid) {
                try {
                    await AdminActivity_1.default.create({
                        adminUser: {
                            username: admin.username,
                            email: admin.email,
                            role: admin.role
                        },
                        action: 'Failed login attempt',
                        actionType: 'login',
                        targetType: 'auth',
                        details: { email, reason: 'invalid_password' },
                        ipAddress: req.ip,
                        success: false
                    });
                }
                catch (logError) {
                    console.warn('Failed to log admin activity:', logError);
                }
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            await VerificationCode_1.default.create({
                email,
                code,
                type: 'admin_login',
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            });
            try {
                await AdminActivity_1.default.create({
                    adminUser: {
                        username: admin.username,
                        email: admin.email,
                        role: admin.role
                    },
                    action: 'Login verification code sent',
                    actionType: 'login',
                    targetType: 'auth',
                    details: { email },
                    ipAddress: req.ip,
                    success: true
                });
            }
            catch (logError) {
                console.warn('Failed to log admin activity:', logError);
            }
            return res.json({
                message: 'Verification code sent',
                requiresVerification: true
            });
        }
        if (action === 'verify') {
            const verification = await VerificationCode_1.default.findOne({
                email,
                code: verificationCode,
                type: 'admin_login',
                expiresAt: { $gt: new Date() },
                used: false
            });
            if (!verification) {
                return res.status(401).json({ error: 'Invalid or expired verification code' });
            }
            const admin = await AdminCredentials_1.default.findOne({ email, isActive: true });
            if (!admin) {
                return res.status(401).json({ error: 'Admin not found' });
            }
            verification.used = true;
            await verification.save();
            admin.lastLoginAt = new Date();
            admin.lastLoginIP = req.ip || 'unknown';
            await admin.save();
            const token = jsonwebtoken_1.default.sign({
                adminId: admin._id,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions
            }, process.env.JWT_SECRET || 'admin-secret', { expiresIn: '24h' });
            try {
                await AdminActivity_1.default.create({
                    adminUser: {
                        username: admin.username,
                        email: admin.email,
                        role: admin.role
                    },
                    action: 'Admin login successful via verification',
                    actionType: 'login',
                    targetType: 'auth',
                    details: { email },
                    ipAddress: req.ip,
                    success: true
                });
            }
            catch (logError) {
                console.warn('Failed to log admin activity:', logError);
            }
            return res.json({
                token,
                admin: {
                    id: admin._id,
                    email: admin.email,
                    role: admin.role,
                    permissions: admin.permissions
                }
            });
        }
        return res.status(400).json({ error: 'Invalid action' });
    }
    catch (error) {
        console.error('Admin auth error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
});
router.get('/auth/check', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        const token = authHeader.substring(7);
        const piApiBaseUrl = pi_config_1.serverPiConfig.PI_BACKEND_PLATFORM_BASE_URL;
        const piResponse = await fetch(`${piApiBaseUrl}/v2/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!piResponse.ok) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Pi Network token'
            });
        }
        const piUserData = await piResponse.json();
        const ADMIN_USER_UIDS = [
            'd0b3fc20-faf3-4897-a7f4-1e2a1a0fa0b1'
        ];
        if (!ADMIN_USER_UIDS.includes(piUserData.uid)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        let user = await User_1.default.findOne({ user_uid: piUserData.uid });
        if (!user) {
            user = new User_1.default({
                user_uid: piUserData.uid,
                piUsername: piUserData.username,
                email: piUserData.email || '',
                role: 'admin',
                status: 'active',
                piAccessToken: token,
                piAuthenticatedAt: new Date()
            });
            await user.save();
        }
        else {
            user.piUsername = piUserData.username;
            user.piAccessToken = token;
            user.piAuthenticatedAt = new Date();
            user.role = 'admin';
            await user.save();
        }
        return res.json({
            success: true,
            isAdmin: true,
            user: {
                id: user._id,
                uid: piUserData.uid,
                username: piUserData.username,
                role: 'admin'
            }
        });
    }
    catch (error) {
        console.error('Admin check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
});
router.get('/users', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search, status, role } = req.query;
        const query = {};
        if (search) {
            const words = String(search)
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            if (words.length > 0) {
                query.$and = words.map((word) => ({
                    $or: [
                        { piUsername: { $regex: word, $options: 'i' } },
                        { user_uid: { $regex: word, $options: 'i' } },
                        { from_address: { $regex: word, $options: 'i' } },
                        { to_address: { $regex: word, $options: 'i' } },
                    ],
                }));
            }
        }
        if (status) {
            query.status = status;
        }
        if (role) {
            const validRoles = ['admin', 'editor', 'author', 'reader'];
            if (validRoles.includes(String(role))) {
                query.role = String(role);
            }
        }
        const users = await User_1.default.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        const total = await User_1.default.countDocuments(query);
        return res.json({
            success: true,
            users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});
router.get('/settings', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const settings = await (0, platform_settings_1.getAllSettings)();
        return res.json({ success: true, settings });
    }
    catch (error) {
        console.error('Error fetching settings:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
});
router.patch('/settings', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const body = req.body || {};
        const updater = req.adminUser?.username || req.adminUser?.email || 'admin';
        const updates = [];
        const setNumber = async (key, min, max, fallback) => {
            if (body[key] === undefined)
                return;
            const value = Number(body[key]);
            if (isNaN(value) || value < min || value > max) {
                throw new Error(`${key} must be a number between ${min} and ${max}`);
            }
            await (0, platform_settings_1.setSetting)(key, value, updater);
            updates.push(key);
        };
        await setNumber('zp_per_pi', 0.001, 100000, platform_settings_1.DEFAULT_SETTINGS.zp_per_pi);
        await setNumber('platform_fee_rate', 0, 0.99, platform_settings_1.DEFAULT_SETTINGS.platform_fee_rate);
        await setNumber('referral_reward_zp', 0, 1000000, platform_settings_1.DEFAULT_SETTINGS.referral_reward_zp);
        if (body.streak_milestones !== undefined) {
            if (!Array.isArray(body.streak_milestones)) {
                throw new Error('streak_milestones must be an array');
            }
            const milestones = body.streak_milestones.map((m) => ({
                days: Math.round(Number(m?.days)),
                zp: Number(m?.zp),
            }));
            for (const m of milestones) {
                if (!isFinite(m.days) || m.days < 1 || !isFinite(m.zp) || m.zp < 0) {
                    throw new Error('Each streak milestone needs a positive days and a non-negative zp');
                }
            }
            milestones.sort((a, b) => a.days - b.days);
            await (0, platform_settings_1.setSetting)('streak_milestones', milestones, updater);
            updates.push('streak_milestones');
        }
        await AdminActivity_1.default.logActivity({ username: req.adminUser.username, email: req.adminUser.email, role: req.adminUser.role }, `Updated platform settings: ${updates.join(', ')}`, 'update', 'system', req.ip || 'unknown', { details: updates });
        return res.json({ success: true, updated: updates, settings: await (0, platform_settings_1.getAllSettings)() });
    }
    catch (error) {
        console.error('Error updating settings:', error);
        return res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update settings',
        });
    }
});
router.patch('/users/:userId', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { role, bio } = req.body || {};
        const updates = {};
        if (role !== undefined) {
            const validRoles = ['admin', 'editor', 'author', 'reader'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ success: false, error: 'Invalid role' });
            }
            updates.role = role;
        }
        if (bio !== undefined) {
            if (typeof bio !== 'string' || bio.length > 500) {
                return res.status(400).json({ success: false, error: 'Bio cannot exceed 500 characters' });
            }
            updates.bio = bio;
        }
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, error: 'No fields to update' });
        }
        const user = await User_1.default.findByIdAndUpdate(userId, { $set: updates }, { new: true });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        await AdminActivity_1.default.logActivity({ username: req.adminUser.username, email: req.adminUser.email, role: req.adminUser.role }, `Updated user ${user.user_uid}`, 'update', 'user', req.ip || 'unknown', { targetId: String(user._id), targetName: user.piUsername || user.user_uid, details: updates });
        return res.json({
            success: true,
            user: {
                _id: user._id,
                user_uid: user.user_uid,
                piUsername: user.piUsername,
                role: user.role,
                bio: user.bio,
                avatar: user.avatar,
            },
        });
    }
    catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ success: false, error: 'Failed to update user' });
    }
});
router.get('/listings', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const [startups, businesses, communities, influencers] = await Promise.all([
            StartupListing_1.default.find().sort({ submittedAt: -1 }),
            BusinessListing_1.default.find().sort({ submittedAt: -1 }),
            CommunityListing_1.default.find().sort({ submittedAt: -1 }),
            InfluencerListing_1.default.find().sort({ submittedAt: -1 })
        ]);
        const listings = [
            ...startups.map(l => ({ ...l.toObject(), listingType: 'startup' })),
            ...businesses.map(l => ({ ...l.toObject(), listingType: 'business' })),
            ...communities.map(l => ({ ...l.toObject(), listingType: 'community' })),
            ...influencers.map(l => ({ ...l.toObject(), listingType: 'influencer' }))
        ].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        res.json({
            success: true,
            listings
        });
    }
    catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch listings'
        });
    }
});
router.post('/listings/:id', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reviewNotes } = req.body;
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action'
            });
        }
        let listing;
        let ListingModel;
        const models = {
            startup: StartupListing_1.default,
            business: BusinessListing_1.default,
            community: CommunityListing_1.default,
            influencer: InfluencerListing_1.default
        };
        for (const [type, Model] of Object.entries(models)) {
            listing = await Model.findById(id);
            if (listing) {
                ListingModel = Model;
                break;
            }
        }
        if (!listing || !ListingModel) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found'
            });
        }
        listing.status = action === 'approve' ? 'approved' : 'rejected';
        listing.reviewedAt = new Date();
        listing.reviewNotes = reviewNotes;
        await listing.save();
        return res.json({
            success: true,
            message: `Listing ${action}ed successfully`
        });
    }
    catch (error) {
        console.error('Error updating listing:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update listing'
        });
    }
});
router.get('/activity', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page || '1', 10);
        const limit = Math.min(parseInt(req.query.limit || '30', 10), 100);
        const skip = (page - 1) * limit;
        const actionType = req.query.actionType;
        const filter = {};
        if (actionType && actionType !== 'all')
            filter.actionType = actionType;
        const [activities, total] = await Promise.all([
            AdminActivity_1.default.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
            AdminActivity_1.default.countDocuments(filter),
        ]);
        return res.json({
            success: true,
            data: activities,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    }
    catch (error) {
        console.error('Error fetching admin activity:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch activity' });
    }
});
router.get('/moderation/queue', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page || '1', 10);
        const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);
        const skip = (page - 1) * limit;
        const [posts, total] = await Promise.all([
            Post_1.default.find({ content_type: 'post', status: 'flagged' })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Post_1.default.countDocuments({ content_type: 'post', status: 'flagged' }),
        ]);
        const authorUIDs = Array.from(new Set(posts.map((p) => p.author_uid).filter(Boolean)));
        const users = await User_1.default.find({ user_uid: { $in: authorUIDs } })
            .select('user_uid piUsername avatar')
            .lean();
        const userMap = {};
        for (const u of users)
            userMap[u.user_uid] = u;
        const data = posts.map((p) => ({
            ...p,
            author: userMap[p.author_uid] || null,
        }));
        return res.json({
            success: true,
            data,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    }
    catch (error) {
        console.error('Error fetching moderation queue:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch moderation queue' });
    }
});
router.patch('/moderation/posts/:postId', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { postId } = req.params;
        const { action } = req.body || {};
        const validActions = ['approve', 'remove', 'flag'];
        if (!validActions.includes(action)) {
            return res.status(400).json({ success: false, error: 'Invalid action' });
        }
        const statusMap = { approve: 'active', remove: 'removed', flag: 'flagged' };
        const update = { status: statusMap[action] };
        if (action === 'remove')
            update.is_boosted = false;
        const post = await Post_1.default.findByIdAndUpdate(postId, { $set: update }, { new: true });
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        await AdminActivity_1.default.logActivity({ username: req.adminUser.username, email: req.adminUser.email, role: req.adminUser.role }, `Moderated post ${postId} (${action})`, 'update', 'system', req.ip || 'unknown', { targetId: postId, targetName: post.author_uid, details: { action, status: statusMap[action] } });
        return res.json({ success: true, post });
    }
    catch (error) {
        console.error('Error moderating post:', error);
        return res.status(500).json({ success: false, error: 'Failed to moderate post' });
    }
});
router.get('/analytics', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { period = '7d' } = req.query;
        let startDate;
        switch (period) {
            case '24h':
                startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        }
        const [userStats, activityStats] = await Promise.all([
            User_1.default.aggregate([
                {
                    $facet: {
                        total: [{ $count: "count" }],
                        recent: [
                            { $match: { createdAt: { $gte: startDate } } },
                            { $count: "count" }
                        ],
                        byStatus: [
                            { $group: { _id: "$status", count: { $sum: 1 } } }
                        ]
                    }
                }
            ]),
            AdminActivity_1.default.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: "$action", count: { $sum: 1 } } }
            ])
        ]);
        return res.json({
            success: true,
            analytics: {
                users: userStats[0],
                activity: activityStats,
                period
            }
        });
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics'
        });
    }
});
router.get('/communities/combined', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { status, limit = 100 } = req.query;
        const [mainCommunities, listingCommunities] = await Promise.all([
            EcosystemCommunity_1.default.find({}).sort({ createdAt: -1 }).limit(Number(limit)),
            CommunityListing_1.default.find({}).sort({ createdAt: -1 }).limit(Number(limit))
        ]);
        const combinedCommunities = [
            ...mainCommunities.map(c => ({
                ...c.toObject(),
                source: 'main',
                listingType: 'community'
            })),
            ...listingCommunities.map(c => ({
                ...c.toObject(),
                source: 'listing',
                listingType: 'community'
            }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        let filteredCommunities = combinedCommunities;
        if (status) {
            filteredCommunities = combinedCommunities.filter(c => c.status === status);
        }
        res.json({
            success: true,
            communities: filteredCommunities,
            stats: {
                total: combinedCommunities.length,
                main: mainCommunities.length,
                listings: listingCommunities.length,
                approved: combinedCommunities.filter(c => c.status === 'approved').length,
                pending: combinedCommunities.filter(c => c.status === 'pending').length,
                rejected: combinedCommunities.filter(c => c.status === 'rejected').length
            }
        });
    }
    catch (error) {
        console.error('Error fetching combined communities:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch communities'
        });
    }
});
router.get('/influencers/combined', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { status, limit = 100 } = req.query;
        const [mainInfluencers, listingInfluencers] = await Promise.all([
            mongoose_1.default.connection.collection('influencers').find({}).sort({ createdAt: -1 }).limit(Number(limit)).toArray(),
            InfluencerListing_1.default.find({}).sort({ createdAt: -1 }).limit(Number(limit))
        ]);
        const combinedInfluencers = [
            ...mainInfluencers.map(i => ({
                ...i,
                source: 'main',
                listingType: 'influencer'
            })),
            ...listingInfluencers.map(i => ({
                ...i.toObject(),
                source: 'listing',
                listingType: 'influencer'
            }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        let filteredInfluencers = combinedInfluencers;
        if (status) {
            filteredInfluencers = combinedInfluencers.filter(i => i.status === status);
        }
        res.json({
            success: true,
            influencers: filteredInfluencers,
            stats: {
                total: combinedInfluencers.length,
                main: mainInfluencers.length,
                listings: listingInfluencers.length,
                approved: combinedInfluencers.filter(i => i.status === 'approved').length,
                pending: combinedInfluencers.filter(i => i.status === 'pending').length,
                rejected: combinedInfluencers.filter(i => i.status === 'rejected').length
            }
        });
    }
    catch (error) {
        console.error('Error fetching combined influencers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch influencers'
        });
    }
});
router.get('/protected-data', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { type } = req.query;
        const ProtectedData = mongoose_1.default.connection.collection('protecteddata');
        const query = {};
        if (type) {
            query.type = type;
        }
        const data = await ProtectedData.find(query).sort({ createdAt: -1 }).toArray();
        res.json({
            success: true,
            data
        });
    }
    catch (error) {
        console.error('Error fetching protected data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch protected data'
        });
    }
});
router.get('/addresses/generated', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const addresses = await mongoose_1.default.connection.collection('generated-addresses')
            .find({}).sort({ createdAt: -1 }).toArray();
        return res.json({
            success: true,
            addresses
        });
    }
    catch (error) {
        console.error('Error fetching generated addresses:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.post('/addresses/generated', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { identifier, Name, Category, Description, Logo, Rank, Website } = req.body;
        if (!identifier || !Name) {
            return res.status(400).json({ success: false, message: 'Identifier and Name are required' });
        }
        const newAddress = {
            identifier,
            Name,
            Category: Category || '',
            Description: Description || '',
            Logo: Logo || '',
            Rank: Rank || 0,
            Website: Website || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await mongoose_1.default.connection.collection('generated-addresses').insertOne(newAddress);
        return res.status(201).json({
            success: true,
            message: 'Address created successfully',
            address: { _id: result.insertedId, ...newAddress }
        });
    }
    catch (error) {
        console.error('Error creating generated address:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.put('/addresses/generated/:id', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { identifier, Name, Category, Description, Logo, Rank, Website } = req.body;
        if (!identifier || !Name) {
            return res.status(400).json({ success: false, message: 'Identifier and Name are required' });
        }
        const updateData = {
            identifier,
            Name,
            Category: Category || '',
            Description: Description || '',
            Logo: Logo || '',
            Rank: Rank || 0,
            Website: Website || '',
            updatedAt: new Date()
        };
        const result = await mongoose_1.default.connection.collection('generated-addresses').findOneAndUpdate({ _id: new mongoose_1.default.Types.ObjectId(id) }, { $set: updateData }, { returnDocument: 'after' });
        if (!result || !result.value) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        return res.json({
            success: true,
            message: 'Address updated successfully',
            address: result.value
        });
    }
    catch (error) {
        console.error('Error updating generated address:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.delete('/addresses/generated/:id', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await mongoose_1.default.connection.collection('generated-addresses').deleteOne({
            _id: new mongoose_1.default.Types.ObjectId(id)
        });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        return res.json({
            success: true,
            message: 'Address deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting generated address:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.get('/addresses/cex', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const addresses = await mongoose_1.default.connection.collection('cex-addresses')
            .find({}).sort({ createdAt: -1 }).toArray();
        return res.json({
            success: true,
            addresses
        });
    }
    catch (error) {
        console.error('Error fetching CEX addresses:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.post('/addresses/cex', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { identifier, name, category, description, logo, buy, website } = req.body;
        if (!identifier || !name) {
            return res.status(400).json({ success: false, message: 'Identifier and name are required' });
        }
        const newAddress = {
            identifier,
            name,
            category: category || '',
            description: description || '',
            logo: logo || '',
            buy: buy || '',
            website: website || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await mongoose_1.default.connection.collection('cex-addresses').insertOne(newAddress);
        return res.status(201).json({
            success: true,
            message: 'Address created successfully',
            address: { _id: result.insertedId, ...newAddress }
        });
    }
    catch (error) {
        console.error('Error creating CEX address:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.put('/addresses/cex/:id', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { identifier, name, category, description, logo, buy, website } = req.body;
        if (!identifier || !name) {
            return res.status(400).json({ success: false, message: 'Identifier and name are required' });
        }
        const updateData = {
            identifier,
            name,
            category: category || '',
            description: description || '',
            logo: logo || '',
            buy: buy || '',
            website: website || '',
            updatedAt: new Date()
        };
        const result = await mongoose_1.default.connection.collection('cex-addresses').findOneAndUpdate({ _id: new mongoose_1.default.Types.ObjectId(id) }, { $set: updateData }, { returnDocument: 'after' });
        if (!result || !result.value) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        return res.json({
            success: true,
            message: 'Address updated successfully',
            address: result.value
        });
    }
    catch (error) {
        console.error('Error updating CEX address:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.delete('/addresses/cex/:id', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await mongoose_1.default.connection.collection('cex-addresses').deleteOne({
            _id: new mongoose_1.default.Types.ObjectId(id)
        });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        return res.json({
            success: true,
            message: 'Address deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting CEX address:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.get('/addresses/core-team', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const addresses = await mongoose_1.default.connection.collection('core-team-addresses')
            .find({}).sort({ createdAt: -1 }).toArray();
        return res.json({
            success: true,
            addresses
        });
    }
    catch (error) {
        console.error('Error fetching core team addresses:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.post('/addresses/core-team', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { identifier, name, description, role } = req.body;
        if (!identifier || !name) {
            return res.status(400).json({ success: false, message: 'Identifier and name are required' });
        }
        const newAddress = {
            identifier,
            name,
            description: description || null,
            role: role || null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await mongoose_1.default.connection.collection('core-team-addresses').insertOne(newAddress);
        return res.status(201).json({
            success: true,
            message: 'Address created successfully',
            address: { _id: result.insertedId, ...newAddress }
        });
    }
    catch (error) {
        console.error('Error creating core team address:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.put('/addresses/core-team/:id', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { identifier, name, description, role } = req.body;
        if (!identifier || !name) {
            return res.status(400).json({ success: false, message: 'Identifier and name are required' });
        }
        const updateData = {
            identifier,
            name,
            description: description || null,
            role: role || null,
            updatedAt: new Date()
        };
        const result = await mongoose_1.default.connection.collection('core-team-addresses').findOneAndUpdate({ _id: new mongoose_1.default.Types.ObjectId(id) }, { $set: updateData }, { returnDocument: 'after' });
        if (!result || !result.value) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        return res.json({
            success: true,
            message: 'Address updated successfully',
            address: result.value
        });
    }
    catch (error) {
        console.error('Error updating core team address:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.delete('/addresses/core-team/:id', auth_1.authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await mongoose_1.default.connection.collection('core-team-addresses').deleteOne({
            _id: new mongoose_1.default.Types.ObjectId(id)
        });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        return res.json({
            success: true,
            message: 'Address deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting core team address:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.post('/pct-monitor/run-scan', auth_1.authenticateAdmin, async (_req, res) => {
    try {
        const result = await (0, pct_balance_scanner_1.runPctBalanceScan)();
        return res.json({
            success: result.ok && !result.error,
            ...result,
        });
    }
    catch (error) {
        console.error('pct-monitor run-scan:', error);
        return res.status(500).json({ success: false, message: 'Scan failed' });
    }
});
router.get('/pct-monitor/stream-status', async (_req, res) => {
    try {
        const streamStateCol = mongoose_1.default.connection.collection('pct-stream-state');
        const metaCol = mongoose_1.default.connection.collection('pct-monitor-meta');
        const [streamState, meta, summaryStored] = await Promise.all([
            streamStateCol.findOne({ _id: 'main' }),
            metaCol.findOne({ _id: 'meta' }),
            (0, pct_summary_1.getPctSummary)(),
        ]);
        const summary = summaryStored ?? (await (0, pct_summary_1.refreshPctSummary)());
        return res.json({
            success: true,
            data: {
                streamState,
                meta,
                summary,
                now: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error('pct-monitor stream-status:', error);
        return res
            .status(500)
            .json({ success: false, message: 'Failed to load stream status' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map