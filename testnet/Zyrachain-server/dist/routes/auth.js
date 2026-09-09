"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../zyrachain-lib/lib/models/User"));
const VerificationCode_1 = __importDefault(require("../zyrachain-lib/lib/models/VerificationCode"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
router.post('/verify', async (req, res) => {
    try {
        const { token, email, code } = req.body;
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default-secret');
                const user = await User_1.default.findById(decoded.userId).select('-password');
                if (!user) {
                    return res.status(401).json({ error: 'User not found' });
                }
                return res.json({
                    valid: true,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        walletAddress: user.walletAddress,
                        status: user.status
                    }
                });
            }
            catch (jwtError) {
                return res.status(401).json({ error: 'Invalid token' });
            }
        }
        if (email && code) {
            const verification = await VerificationCode_1.default.findOne({
                email,
                code,
                type: 'email_verification',
                expiresAt: { $gt: new Date() },
                used: false
            });
            if (!verification) {
                return res.status(400).json({ error: 'Invalid or expired verification code' });
            }
            verification.used = true;
            await verification.save();
            const user = await User_1.default.findOneAndUpdate({ email }, { emailVerified: true, status: 'active' }, { new: true }).select('-password');
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.json({
                success: true,
                message: 'Email verified successfully',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    walletAddress: user.walletAddress,
                    status: user.status
                }
            });
        }
        return res.status(400).json({ error: 'Token or email/code required' });
    }
    catch (error) {
        console.error('Token verification error:', error);
        return res.status(500).json({ error: 'Verification failed' });
    }
});
router.post('/generate-code', async (req, res) => {
    try {
        const { email, type = 'email_verification' } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await VerificationCode_1.default.create({
            email,
            code,
            type,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });
        return res.json({
            success: true,
            message: 'Verification code sent to email'
        });
    }
    catch (error) {
        console.error('Error generating verification code:', error);
        return res.status(500).json({ error: 'Failed to generate verification code' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map