"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const User_1 = __importDefault(require("../zyrachain-lib/lib/models/User"));
const Referral_1 = __importDefault(require("../zyrachain-lib/lib/models/Referral"));
const token_ledger_1 = require("../services/token-ledger");
const platform_settings_1 = require("../services/platform-settings");
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
function normalizeUsername(raw) {
    return String(raw || '').trim().replace(/^@/, '').toLowerCase();
}
router.post('/apply', auth_1.authenticateUser, async (req, res) => {
    try {
        const code = normalizeUsername(req.body?.code);
        if (!code) {
            return res.status(400).json({ success: false, error: 'Referral code (username) is required' });
        }
        const current = await User_1.default.findOne({ user_uid: req.user.user_uid });
        if (!current) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        const ownUsername = normalizeUsername(current.piUsername || '');
        if (ownUsername && ownUsername === code) {
            return res.status(400).json({ success: false, error: 'You cannot refer yourself' });
        }
        if (current.referred_by) {
            return res.status(400).json({ success: false, error: 'Referral code already applied' });
        }
        const alreadyReferral = await Referral_1.default.findOne({ referred_uid: req.user.user_uid });
        if (alreadyReferral) {
            return res.status(400).json({ success: false, error: 'Referral already processed' });
        }
        const referrer = await User_1.default.findOne({ piUsername: code });
        if (!referrer) {
            return res.status(404).json({ success: false, error: 'Referral code not found' });
        }
        if (referrer.user_uid === req.user.user_uid) {
            return res.status(400).json({ success: false, error: 'You cannot refer yourself' });
        }
        current.referred_by = referrer.piUsername;
        current.referred_at = new Date();
        await current.save();
        const reward = await (0, platform_settings_1.getReferralReward)();
        let credited = false;
        if (reward > 0) {
            const referral = new Referral_1.default({
                referrer_uid: referrer.user_uid,
                referrer_username: referrer.piUsername || referrer.user_uid,
                referred_uid: req.user.user_uid,
                referred_username: current.piUsername || req.user.user_uid,
                reward_zp: reward,
                status: 'rewarded',
            });
            await referral.save();
            await (0, token_ledger_1.creditZP)(referrer.user_uid, reward, 'referral_reward', 'earned', referral._id, 'Referral', {
                description: `Referral reward for ${current.piUsername || req.user.user_uid}`,
            });
            credited = true;
        }
        return res.json({
            success: true,
            referred_by: referrer.piUsername,
            reward_credited: credited,
            message: credited ? 'Referral applied and reward credited' : 'Referral applied',
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/stats', auth_1.authenticateUser, async (req, res) => {
    try {
        const user = await User_1.default.findOne({ user_uid: req.user.user_uid }).lean();
        if (!user)
            return res.status(404).json({ success: false, error: 'User not found' });
        const [referrals, earnedRows] = await Promise.all([
            Referral_1.default.find({ referrer_uid: req.user.user_uid }).sort({ createdAt: -1 }).lean(),
            mongoose_1.default.connection
                .collection('tokentransactions')
                .find({ to_user_uid: req.user.user_uid, tx_type: 'referral_reward' })
                .toArray(),
        ]);
        const totalEarned = earnedRows.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        return res.json({
            success: true,
            data: {
                code: user.piUsername || '',
                referral_count: referrals.length,
                total_earned: Math.round(totalEarned * 10000) / 10000,
                referrals: referrals.map((r) => ({
                    referred_username: r.referred_username,
                    reward_zp: r.reward_zp,
                    createdAt: r.createdAt,
                })),
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=social-referrals.js.map