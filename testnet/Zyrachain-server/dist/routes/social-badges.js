"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const Badge_1 = __importDefault(require("../zyrachain-lib/lib/models/Badge"));
const UserBadge_1 = __importDefault(require("../zyrachain-lib/lib/models/UserBadge"));
const token_ledger_1 = require("../services/token-ledger");
const badge_evaluator_1 = require("../services/badge-evaluator");
const router = express_1.default.Router();
router.get('/', auth_1.authenticateUser, async (req, res) => {
    try {
        await (0, badge_evaluator_1.seedDefaultBadges)();
        const badges = await Badge_1.default.find({ active: true }).sort({ tier: 1, category: 1 }).lean();
        return res.json({ success: true, data: badges });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/:uid/earned', auth_1.authenticateUser, async (req, res) => {
    try {
        const userBadges = await UserBadge_1.default.find({ user_uid: req.params.uid })
            .populate('badge_id')
            .sort({ earned_at: -1 })
            .lean();
        const data = userBadges.map((b) => ({
            badge_key: b.badge_id?.badge_key || '',
            name: b.badge_id?.name || '',
            description: b.badge_id?.description || '',
            icon: b.badge_id?.icon || '',
            category: b.badge_id?.category || '',
            tier: b.badge_id?.tier || 1,
            earned_at: b.earned_at,
            expires_at: b.expires_at,
        }));
        return res.json({ success: true, data });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/:badgeId/purchase', auth_1.authenticateUser, async (req, res) => {
    try {
        const badge = await Badge_1.default.findById(req.params.badgeId);
        if (!badge)
            return res.status(404).json({ success: false, error: 'Badge not found' });
        if (badge.category !== 'paid' || !badge.price) {
            return res.status(400).json({ success: false, error: 'Badge is not purchasable' });
        }
        const existing = await UserBadge_1.default.findOne({
            user_uid: req.user.user_uid,
            badge_id: badge._id,
        });
        if (existing)
            return res.status(400).json({ success: false, error: 'Badge already owned' });
        await (0, token_ledger_1.debitZP)(req.user.user_uid, badge.price, 'badge_purchase', badge._id, 'Badge', {
            badge_name: badge.name,
        });
        const userBadge = new UserBadge_1.default({
            user_uid: req.user.user_uid,
            badge_id: badge._id,
            earned_at: new Date(),
        });
        await userBadge.save();
        const UserActivity = require('../zyrachain-lib/lib/models/UserActivity').default;
        await UserActivity.create({
            user_uid: req.user.user_uid,
            event_type: 'badge_earned',
            actor_uid: req.user.user_uid,
            reference_id: badge._id,
            reference_model: 'Badge',
            metadata: { badge_key: badge.badge_key, badge_name: badge.name, purchased: true },
        });
        return res.json({ success: true, data: { badge_key: badge.badge_key, name: badge.name, price: badge.price } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=social-badges.js.map