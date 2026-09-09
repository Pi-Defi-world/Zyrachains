"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const Post_1 = __importDefault(require("../zyrachain-lib/lib/models/Post"));
const ModerationVote_1 = __importDefault(require("../zyrachain-lib/lib/models/ModerationVote"));
const Badge_1 = __importDefault(require("../zyrachain-lib/lib/models/Badge"));
const UserBadge_1 = __importDefault(require("../zyrachain-lib/lib/models/UserBadge"));
const token_ledger_1 = require("../services/token-ledger");
const gamification_service_1 = require("../services/gamification-service");
const post_enrich_1 = require("../services/post-enrich");
const router = express_1.default.Router();
const MODERATOR_STAKE = 50;
const VOTE_STAKE = 5;
function parseQueryParam(val, fallback) {
    const n = parseInt(val);
    return isNaN(n) || n < 1 ? fallback : n;
}
router.get('/queue', auth_1.authenticateUser, async (req, res) => {
    try {
        const page = parseQueryParam(req.query.page, 1);
        const limit = parseQueryParam(req.query.limit, 20);
        const skip = (page - 1) * limit;
        const query = { content_type: 'post', status: 'flagged' };
        const [posts, total] = await Promise.all([
            Post_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Post_1.default.countDocuments(query),
        ]);
        for (const post of posts) {
            const voteCount = await ModerationVote_1.default.countDocuments({ post_uid: post._id });
            post.vote_count = voteCount;
        }
        const enriched = await (0, post_enrich_1.enrichPostsWithAuthors)(posts, req.user.user_uid);
        return res.json({
            success: true,
            data: enriched,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/stake', auth_1.authenticateUser, async (req, res) => {
    try {
        const moderatorBadge = await Badge_1.default.findOne({ badge_key: 'moderator' });
        if (!moderatorBadge)
            return res.status(404).json({ success: false, error: 'Moderator badge not found' });
        const existing = await UserBadge_1.default.findOne({
            user_uid: req.user.user_uid,
            badge_id: moderatorBadge._id,
        });
        if (existing)
            return res.status(400).json({ success: false, error: 'Already a moderator' });
        await (0, token_ledger_1.debitZP)(req.user.user_uid, MODERATOR_STAKE, 'moderation_loss', null, '', {
            description: 'Moderator staking',
        });
        const userBadge = new UserBadge_1.default({
            user_uid: req.user.user_uid,
            badge_id: moderatorBadge._id,
            earned_at: new Date(),
            metadata: { staked: MODERATOR_STAKE },
        });
        await userBadge.save();
        return res.json({ success: true, message: `Staked ${MODERATOR_STAKE} ZP. You are now a moderator.` });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/vote', auth_1.authenticateUser, async (req, res) => {
    try {
        const { post_id, vote, reason } = req.body;
        if (!post_id || !['flag', 'approve', 'abstain'].includes(vote)) {
            return res.status(400).json({ success: false, error: 'post_id and valid vote (flag/approve/abstain) required' });
        }
        const moderatorBadge = await Badge_1.default.findOne({ badge_key: 'moderator' });
        if (!moderatorBadge)
            return res.status(404).json({ success: false, error: 'Moderator badge not found' });
        const isModerator = await UserBadge_1.default.findOne({
            user_uid: req.user.user_uid,
            badge_id: moderatorBadge._id,
        });
        if (!isModerator)
            return res.status(403).json({ success: false, error: 'Must be a moderator to vote' });
        const post = await Post_1.default.findById(post_id);
        if (!post)
            return res.status(404).json({ success: false, error: 'Post not found' });
        if (post.status !== 'flagged') {
            return res.status(400).json({ success: false, error: 'Post is not flagged' });
        }
        const existingVote = await ModerationVote_1.default.findOne({
            post_uid: post._id,
            moderator_uid: req.user.user_uid,
        });
        if (existingVote)
            return res.status(400).json({ success: false, error: 'Already voted on this post' });
        const voteStake = vote === 'abstain' ? 1 : VOTE_STAKE;
        await (0, token_ledger_1.debitZP)(req.user.user_uid, voteStake, 'moderation_loss', post._id, 'Post', {
            description: `Moderation vote stake: ${vote}`,
        });
        const modVote = new ModerationVote_1.default({
            post_uid: post._id,
            moderator_uid: req.user.user_uid,
            vote,
            token_staked: voteStake,
            reason: reason || '',
        });
        await modVote.save();
        await (0, gamification_service_1.addXP)(req.user.user_uid, 2, 'moderation_vote');
        return res.json({ success: true, vote_id: modVote._id });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/stats', auth_1.authenticateUser, async (req, res) => {
    try {
        const [totalVotes, correctVotes, totalStaked] = await Promise.all([
            ModerationVote_1.default.countDocuments({ moderator_uid: req.user.user_uid }),
            ModerationVote_1.default.countDocuments({ moderator_uid: req.user.user_uid, resolution: 'win' }),
            ModerationVote_1.default.aggregate([
                { $match: { moderator_uid: req.user.user_uid } },
                { $group: { _id: null, total: { $sum: '$token_staked' } } },
            ]),
        ]);
        const isModerator = !!(await Badge_1.default.findOne({ badge_key: 'moderator' }).then(async (badge) => {
            if (!badge)
                return false;
            return UserBadge_1.default.findOne({ user_uid: req.user.user_uid, badge_id: badge._id });
        }));
        return res.json({
            success: true,
            data: {
                is_moderator: !!isModerator,
                total_votes: totalVotes,
                correct_votes: correctVotes,
                accuracy: totalVotes > 0 ? Math.round((correctVotes / totalVotes) * 100) : 0,
                total_staked: totalStaked[0]?.total || 0,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=social-moderation.js.map