"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = exports.authenticateAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../zyrachain-lib/lib/models/User"));
const pi_config_1 = require("../zyrachain-lib/config/pi-config");
const ADMIN_USER_UIDS = [
    'd0b3fc20-faf3-4897-a7f4-1e2a1a0fa0b1'
];
const authenticateAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        const token = authHeader.substring(7);
        try {
            console.log('🔍 Attempting JWT verification...');
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'admin-secret');
            console.log('✅ JWT verification successful:', { adminId: decoded.adminId, email: decoded.email, role: decoded.role });
            req.adminUser = decoded;
            return next();
        }
        catch (jwtError) {
            console.log('❌ JWT verification failed:', jwtError instanceof Error ? jwtError.message : 'Unknown error');
            return res.status(401).json({
                success: false,
                message: 'Invalid JWT token'
            });
        }
    }
    catch (error) {
        console.error('Admin authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};
exports.authenticateAdmin = authenticateAdmin;
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        const token = authHeader.substring(7);
        const piApiBaseUrl = pi_config_1.serverPiConfig.PI_BACKEND_PLATFORM_BASE_URL ||
            (process.env.PI_ENV === 'sandbox' || process.env.PI_SANDBOX_MODE === 'true'
                ? 'https://api.testnet.minepi.com'
                : 'https://api.minepi.com');
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
        let user = await User_1.default.findOne({ user_uid: piUserData.uid });
        if (!user) {
            if (piUserData.username) {
                user = await User_1.default.findOne({ piUsername: piUserData.username });
            }
        }
        if (!user) {
            user = new User_1.default({
                user_uid: piUserData.uid,
                piUsername: piUserData.username,
                role: 'reader',
                piAccessToken: token,
                piAuthenticatedAt: new Date()
            });
            await user.save();
        }
        else {
            user.user_uid = piUserData.uid;
            user.piUsername = piUserData.username;
            user.piAccessToken = token;
            user.piAuthenticatedAt = new Date();
            await user.save();
        }
        req.user = user;
        return next();
    }
    catch (error) {
        console.error('User authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};
exports.authenticateUser = authenticateUser;
//# sourceMappingURL=auth.js.map