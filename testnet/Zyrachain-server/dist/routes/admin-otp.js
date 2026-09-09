"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AdminCredentials_1 = __importDefault(require("../zyrachain-lib/lib/models/AdminCredentials"));
const AdminActivity_1 = __importDefault(require("../zyrachain-lib/lib/models/AdminActivity"));
const OTP_1 = __importDefault(require("../zyrachain-lib/lib/models/OTP"));
const auth_1 = require("../middleware/auth");
const email_service_1 = require("../zyrachain-lib/lib/email-service");
const mongoose_1 = __importDefault(require("mongoose"));
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
            const validRoles = ['super_admin', 'admin', 'editor_admin'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role. Must be: super_admin, admin, or editor_admin'
                });
            }
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const savedOTP = await OTP_1.default.create({
                email: email.toLowerCase(),
                otp: otpCode,
                role,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            });
            console.log('✅ OTP saved:', { email: savedOTP.email, otp: savedOTP.otp, role: savedOTP.role });
            try {
                await (0, email_service_1.sendOTPEmail)(email, otpCode, role);
            }
            catch (emailError) {
                console.error('❌ Failed to send OTP email:', emailError);
            }
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
        console.log('🔍 Looking for OTP:', { email: email.toLowerCase(), otp, used: false });
        const otpRecord = await OTP_1.default.findOne({
            email: email.toLowerCase(),
            otp,
            used: false,
            expiresAt: { $gt: new Date() }
        });
        if (!otpRecord) {
            console.log('❌ Invalid or expired OTP for:', email);
            const allOtpsForEmail = await OTP_1.default.find({ email: email.toLowerCase() });
            console.log('🔍 All OTPs for email:', allOtpsForEmail);
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }
        otpRecord.used = true;
        await otpRecord.save();
        let admin = await AdminCredentials_1.default.findOne({ email: email.toLowerCase() });
        if (!admin) {
            const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            admin = await AdminCredentials_1.default.create({
                email: email.toLowerCase(),
                username: email.split('@')[0],
                password: randomPassword,
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
                name: admin.username,
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
router.get('/auth/check', auth_1.authenticateAdmin, async (req, res) => {
    try {
        console.log('🔍 Auth check - adminUser:', req.adminUser);
        const admin = await AdminCredentials_1.default.findById(req.adminUser?.adminId);
        console.log('🔍 Found admin:', admin ? { id: admin._id, email: admin.email, isActive: admin.isActive } : 'null');
        if (!admin || !admin.isActive) {
            console.log('❌ Auth check failed - admin not found or inactive');
            return res.status(401).json({
                success: false,
                message: 'Invalid or inactive admin account'
            });
        }
        console.log('✅ Auth check successful for:', admin.email);
        return res.json({
            success: true,
            user: {
                id: admin._id,
                name: admin.username,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions
            }
        });
    }
    catch (error) {
        console.error('Auth check error:', error);
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
exports.default = router;
//# sourceMappingURL=admin-otp.js.map