"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../zyrachain-lib/lib/models/User"));
const router = express_1.default.Router();
router.get('/profile/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const user = await User_1.default.findOne({ uid }).select('-password');
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        return res.json({
            success: true,
            user
        });
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({
            error: 'Failed to fetch user profile'
        });
    }
});
router.put('/profile/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const updateData = req.body;
        delete updateData.uid;
        delete updateData.password;
        delete updateData.role;
        const user = await User_1.default.findOneAndUpdate({ uid }, updateData, { new: true, runValidators: true }).select('-password');
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        return res.json({
            success: true,
            user
        });
    }
    catch (error) {
        console.error('Error updating user profile:', error);
        return res.status(500).json({
            error: 'Failed to update user profile'
        });
    }
});
router.post('/sync', async (req, res) => {
    try {
        const { uid, username, email, wallet_address } = req.body;
        if (!uid) {
            return res.status(400).json({
                error: 'User ID is required'
            });
        }
        let user = await User_1.default.findOne({ uid });
        if (user) {
            user.username = username || user.username;
            user.email = email || user.email;
            user.wallet_address = wallet_address || user.wallet_address;
            user.lastLoginAt = new Date();
            await user.save();
        }
        else {
            user = new User_1.default({
                uid,
                username,
                email,
                wallet_address,
                role: 'user',
                isActive: true,
                lastLoginAt: new Date()
            });
            await user.save();
        }
        return res.json({
            success: true,
            user: {
                uid: user.uid,
                username: user.username,
                email: user.email,
                wallet_address: user.wallet_address,
                role: user.role,
                isActive: user.isActive
            }
        });
    }
    catch (error) {
        console.error('Error syncing user:', error);
        return res.status(500).json({
            error: 'Failed to sync user'
        });
    }
});
router.get('/stats/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const user = await User_1.default.findOne({ uid });
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        const BusinessListing = require('../zyrachain-lib/lib/models/BusinessListing').default;
        const StartupListing = require('../zyrachain-lib/lib/models/StartupListing').default;
        const CommunityListing = require('../zyrachain-lib/lib/models/CommunityListing').default;
        const InfluencerListing = require('../zyrachain-lib/lib/models/InfluencerListing').default;
        const [businessCount, startupCount, communityCount, influencerCount] = await Promise.all([
            BusinessListing.countDocuments({ 'contactInfo.email': user.email }),
            StartupListing.countDocuments({ 'contactInfo.email': user.email }),
            CommunityListing.countDocuments({ 'contactEmail': user.email }),
            InfluencerListing.countDocuments({ 'contactEmail': user.email })
        ]);
        const stats = {
            totalListings: businessCount + startupCount + communityCount + influencerCount,
            businessListings: businessCount,
            startupListings: startupCount,
            communityListings: communityCount,
            influencerListings: influencerCount,
            memberSince: user.createdAt,
            lastLogin: user.lastLoginAt
        };
        return res.json({
            success: true,
            stats
        });
    }
    catch (error) {
        console.error('Error fetching user stats:', error);
        return res.status(500).json({
            error: 'Failed to fetch user statistics'
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map