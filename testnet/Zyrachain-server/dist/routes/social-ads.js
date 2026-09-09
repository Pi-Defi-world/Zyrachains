"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const pi_config_1 = require("../zyrachain-lib/config/pi-config");
const AdCampaign_1 = __importDefault(require("../zyrachain-lib/lib/models/AdCampaign"));
const AdView_1 = __importDefault(require("../zyrachain-lib/lib/models/AdView"));
const token_ledger_1 = require("../services/token-ledger");
const gamification_service_1 = require("../services/gamification-service");
const mission_generator_1 = require("../services/mission-generator");
const router = express_1.default.Router();
const DAILY_AD_LIMIT = 10;
function parseQueryParam(val, fallback) {
    const n = parseInt(val);
    return isNaN(n) || n < 1 ? fallback : n;
}
router.get('/', auth_1.authenticateUser, async (req, res) => {
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const watchedToday = await AdView_1.default.countDocuments({
            user_uid: req.user.user_uid,
            viewed_at: { $gte: today },
        });
        const watchedAdIds = await AdView_1.default.find({ user_uid: req.user.user_uid }).distinct('ad_id');
        const remaining = Math.max(0, DAILY_AD_LIMIT - watchedToday);
        const availableAds = await AdCampaign_1.default.find({
            active: true,
            _id: { $nin: watchedAdIds },
            views_remaining: { $gt: 0 },
            $or: [
                { expires_at: null },
                { expires_at: { $gt: new Date() } },
            ],
        })
            .sort({ priority: -1, reward_per_view: -1 })
            .limit(20)
            .lean();
        return res.json({
            success: true,
            data: {
                daily_limit: DAILY_AD_LIMIT,
                watched_today: watchedToday,
                remaining: remaining,
                ads: availableAds,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/:id/watch', auth_1.authenticateUser, async (req, res) => {
    try {
        const ad = await AdCampaign_1.default.findById(req.params.id);
        if (!ad)
            return res.status(404).json({ success: false, error: 'Ad not found' });
        if (!ad.active)
            return res.status(400).json({ success: false, error: 'Ad is no longer active' });
        if (ad.views_remaining <= 0)
            return res.status(400).json({ success: false, error: 'Ad has no more views' });
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const watchedToday = await AdView_1.default.countDocuments({
            user_uid: req.user.user_uid,
            viewed_at: { $gte: today },
        });
        if (watchedToday >= DAILY_AD_LIMIT) {
            return res.status(400).json({ success: false, error: `Daily ad watch limit (${DAILY_AD_LIMIT}) reached` });
        }
        const existing = await AdView_1.default.findOne({
            user_uid: req.user.user_uid,
            ad_id: ad._id,
        });
        if (existing)
            return res.status(400).json({ success: false, error: 'Already watched this ad' });
        const reward = ad.reward_per_view;
        await (0, token_ledger_1.creditZP)(req.user.user_uid, reward, 'ad_reward', 'ad', ad._id, 'AdCampaign', {
            ad_title: ad.title,
            ad_source: ad.ad_source,
        });
        ad.tokens_spent += reward;
        ad.views_total += 1;
        ad.views_remaining = Math.max(0, ad.views_remaining - 1);
        if (ad.views_remaining <= 0)
            ad.active = false;
        await ad.save();
        const view = new AdView_1.default({
            user_uid: req.user.user_uid,
            ad_id: ad._id,
            tokens_earned: reward,
            viewed_at: new Date(),
        });
        await view.save();
        await (0, gamification_service_1.addXP)(req.user.user_uid, 1, 'watch_ad');
        await (0, mission_generator_1.updateMissionProgress)(req.user.user_uid, 'watch_ad', 1);
        const account = await (0, token_ledger_1.getTokenAccount)(req.user.user_uid);
        return res.json({
            success: true,
            data: {
                reward,
                new_balance: account.balance,
                watched_today: watchedToday + 1,
                daily_remaining: Math.max(0, DAILY_AD_LIMIT - (watchedToday + 1)),
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/reward-status', auth_1.authenticateUser, async (req, res) => {
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const watchedToday = await AdView_1.default.countDocuments({
            user_uid: req.user.user_uid,
            viewed_at: { $gte: today },
        });
        const totalEarned = await AdView_1.default.aggregate([
            { $match: { user_uid: req.user.user_uid } },
            { $group: { _id: null, total: { $sum: '$tokens_earned' } } },
        ]);
        return res.json({
            success: true,
            data: {
                daily_limit: DAILY_AD_LIMIT,
                watched_today: watchedToday,
                remaining: Math.max(0, DAILY_AD_LIMIT - watchedToday),
                total_earned_from_ads: totalEarned[0]?.total || 0,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/verify', auth_1.authenticateUser, async (req, res) => {
    try {
        const { adId } = req.body;
        if (!adId)
            return res.status(400).json({ success: false, error: 'adId required' });
        const isSandbox = process.env.PI_ENV === 'sandbox' || process.env.PI_SANDBOX_MODE === 'true';
        const configuredBase = process.env.PI_PLATFORM_API_URL || pi_config_1.serverPiConfig.PI_BACKEND_PLATFORM_BASE_URL;
        const piApiBase = configuredBase || (isSandbox ? 'https://api.testnet.minepi.com' : 'https://api.minepi.com');
        const apiKey = process.env.PI_NETWORK_API_KEY || pi_config_1.serverPiConfig.PI_API_KEY;
        if (!apiKey)
            return res.status(500).json({ success: false, granted: false, error: 'Pi API key not configured' });
        let response;
        try {
            response = await fetch(`${piApiBase}/v2/ads/rewarded/${adId}`, {
                headers: { Authorization: `Key ${apiKey}` },
            });
        }
        catch (err) {
            console.error('Pi ads verification network error:', err.message);
            return res.status(502).json({ success: false, granted: false, error: 'Pi ads verification unreachable' });
        }
        if (!response.ok) {
            console.error('Pi ads verification rejected:', response.status);
            return res.status(502).json({ success: false, granted: false, error: `Pi ads verification failed (${response.status})` });
        }
        const data = await response.json();
        const granted = data?.mediator_ack_status === 'granted';
        if (granted) {
            const REWARD_AMOUNT = 5;
            await (0, token_ledger_1.creditZP)(req.user.user_uid, REWARD_AMOUNT, 'ad_reward', 'ad', null, '', {
                description: 'Pi rewarded ad',
                ad_source: 'pi_ads',
                pi_ad_id: adId,
            });
        }
        return res.json({ success: true, granted });
    }
    catch (err) {
        console.error('Pi ads verify error:', err.message);
        return res.status(500).json({ success: false, granted: false, error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=social-ads.js.map