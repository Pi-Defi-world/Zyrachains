"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const Post_1 = __importDefault(require("../zyrachain-lib/lib/models/Post"));
const UserAction_1 = __importDefault(require("../zyrachain-lib/lib/models/UserAction"));
const UserActivity_1 = __importDefault(require("../zyrachain-lib/lib/models/UserActivity"));
const UserFollow_1 = __importDefault(require("../zyrachain-lib/lib/models/UserFollow"));
const SocialBoost_1 = __importDefault(require("../zyrachain-lib/lib/models/SocialBoost"));
const token_ledger_1 = require("../services/token-ledger");
const trending_scorer_1 = require("../services/trending-scorer");
const post_enrich_1 = require("../services/post-enrich");
const gamification_service_1 = require("../services/gamification-service");
const mission_generator_1 = require("../services/mission-generator");
const badge_evaluator_1 = require("../services/badge-evaluator");
const router = express_1.default.Router();
const LIKE_COST = 0.1;
const DISLIKE_COST = 0.1;
const RESHARE_COST = 0.5;
const MIN_TIP = 1;
const MIN_BOOST = 10;
const BOOST_DURATION_HOURS = 48;
function parseQueryParam(val, fallback) {
    const n = parseInt(val);
    return isNaN(n) || n < 1 ? fallback : n;
}
const writerCooldownMs = 15000;
const writeCooldowns = new Map();
let lastCooldownPrune = Date.now();
function allowWrite(uid) {
    const now = Date.now();
    if (now - lastCooldownPrune > 10 * 60 * 1000) {
        writeCooldowns.clear();
        lastCooldownPrune = now;
    }
    const last = writeCooldowns.get(uid);
    if (last && now - last < writerCooldownMs)
        return false;
    writeCooldowns.set(uid, now);
    return true;
}
router.get('/', auth_1.authenticateUser, async (req, res) => {
    try {
        const type = req.query.type || 'new';
        const page = parseQueryParam(req.query.page, 1);
        const limit = Math.min(parseQueryParam(req.query.limit, 20), 50);
        const userUID = req.user.user_uid;
        let result;
        if (type === 'following') {
            const follows = await UserFollow_1.default.find({ follower_uid: userUID }).distinct('followed_uid');
            result = await (0, trending_scorer_1.getFollowingFeed)(userUID, follows.map(String), page, limit);
        }
        else if (type === 'trending') {
            result = await (0, trending_scorer_1.getTrendingFeed)(page, limit);
        }
        else {
            result = await (0, trending_scorer_1.getNewFeed)(page, limit);
        }
        if (result.posts.length > 0) {
            await Post_1.default.bulkWrite(result.posts.map((post) => ({
                updateOne: {
                    filter: { _id: post._id },
                    update: { $inc: { impression_count: 1 } },
                },
            })));
        }
        const enriched = await (0, post_enrich_1.enrichPostsWithAuthors)(result.posts, userUID);
        return res.json({
            success: true,
            data: enriched,
            pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/', auth_1.authenticateUser, async (req, res) => {
    try {
        if (!allowWrite(req.user.user_uid)) {
            return res.status(429).json({ success: false, error: 'Please wait a moment before posting again' });
        }
        const { content, images, tags, visibility } = req.body;
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Content is required' });
        }
        if (content.length > 2000) {
            return res.status(400).json({ success: false, error: 'Content exceeds 2000 characters' });
        }
        const post = new Post_1.default({
            author_uid: req.user.user_uid,
            content: content.trim(),
            images: images || [],
            tags: tags || [],
            visibility: visibility || 'public',
            content_type: 'post',
            token_cost: 0,
            trending_score: 0,
        });
        await post.save();
        const { getOrCreateGameStats } = require('../services/gamification-service');
        const stats = await getOrCreateGameStats(req.user.user_uid);
        stats.total_posts += 1;
        await stats.save();
        await UserActivity_1.default.create({
            user_uid: req.user.user_uid,
            event_type: 'post_created',
            actor_uid: req.user.user_uid,
            reference_id: post._id,
            reference_model: 'Post',
        });
        await (0, gamification_service_1.addXP)(req.user.user_uid, 10, 'post_created');
        await (0, mission_generator_1.updateMissionProgress)(req.user.user_uid, 'create_post', 1);
        await (0, badge_evaluator_1.checkTriggerBadges)(req.user.user_uid, 'post_created');
        return res.json({ success: true, data: post });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/search', auth_1.authenticateUser, async (req, res) => {
    try {
        const q = req.query.q;
        if (!q || q.length < 2) {
            return res.status(400).json({ success: false, error: 'Search query too short' });
        }
        const page = parseQueryParam(req.query.page, 1);
        const limit = Math.min(parseQueryParam(req.query.limit, 20), 50);
        const skip = (page - 1) * limit;
        const [posts, total] = await Promise.all([
            Post_1.default.find({ $text: { $search: q }, status: 'active', content_type: 'post' }, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } })
                .skip(skip)
                .limit(limit)
                .lean(),
            Post_1.default.countDocuments({ $text: { $search: q }, status: 'active', content_type: 'post' }),
        ]);
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
router.get('/:id', auth_1.authenticateUser, async (req, res) => {
    try {
        const post = await Post_1.default.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        const commentCount = await Post_1.default.countDocuments({ parent_id: post._id, status: { $ne: 'removed' } });
        const userActions = await UserAction_1.default.find({
            user_uid: req.user.user_uid,
            post_uid: post._id,
        }).lean();
        const userActionMap = {};
        for (const action of userActions) {
            userActionMap[action.action_type] = true;
        }
        const enrichedPost = await (0, post_enrich_1.enrichPostWithAuthor)({ ...post.toObject(), comment_count: commentCount }, req.user.user_uid);
        return res.json({
            success: true,
            data: enrichedPost,
            user_actions: userActionMap,
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.delete('/:id', auth_1.authenticateUser, async (req, res) => {
    try {
        const post = await Post_1.default.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        if (post.author_uid !== req.user.user_uid) {
            return res.status(403).json({ success: false, error: 'Not authorized to delete this post' });
        }
        post.status = 'removed';
        await post.save();
        return res.json({ success: true, message: 'Post removed' });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/:id/like', auth_1.authenticateUser, async (req, res) => {
    try {
        const post = await Post_1.default.findById(req.params.id);
        if (!post)
            return res.status(404).json({ success: false, error: 'Post not found' });
        const existing = await UserAction_1.default.findOne({
            user_uid: req.user.user_uid,
            post_uid: post._id,
            action_type: 'like',
        });
        if (existing)
            return res.status(400).json({ success: false, error: 'Already liked' });
        await (0, token_ledger_1.debitZP)(req.user.user_uid, LIKE_COST, 'like_cost', post._id, 'Post');
        post.like_count += 1;
        post.trending_score = (0, trending_scorer_1.computeTrendingScore)(post);
        await post.save();
        await UserAction_1.default.create({
            user_uid: req.user.user_uid,
            post_uid: post._id,
            action_type: 'like',
            token_amount: LIKE_COST,
        });
        await UserActivity_1.default.create({
            user_uid: post.author_uid,
            event_type: 'post_liked',
            actor_uid: req.user.user_uid,
            reference_id: post._id,
            reference_model: 'Post',
        });
        await (0, gamification_service_1.addXP)(req.user.user_uid, 1, 'like');
        if (post.author_uid !== req.user.user_uid) {
            await (0, gamification_service_1.addXP)(post.author_uid, 0.5, 'received_like');
            const { getOrCreateGameStats } = require('../services/gamification-service');
            const authorStats = await getOrCreateGameStats(post.author_uid);
            authorStats.total_likes_received += 1;
            await authorStats.save();
        }
        await (0, mission_generator_1.updateMissionProgress)(req.user.user_uid, 'like_posts', 1);
        return res.json({ success: true, like_count: post.like_count });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/:id/dislike', auth_1.authenticateUser, async (req, res) => {
    try {
        const post = await Post_1.default.findById(req.params.id);
        if (!post)
            return res.status(404).json({ success: false, error: 'Post not found' });
        const existing = await UserAction_1.default.findOne({
            user_uid: req.user.user_uid,
            post_uid: post._id,
            action_type: 'dislike',
        });
        if (existing)
            return res.status(400).json({ success: false, error: 'Already disliked' });
        await (0, token_ledger_1.debitZP)(req.user.user_uid, DISLIKE_COST, 'dislike_cost', post._id, 'Post');
        post.dislike_count += 1;
        await post.save();
        await UserAction_1.default.create({
            user_uid: req.user.user_uid,
            post_uid: post._id,
            action_type: 'dislike',
            token_amount: DISLIKE_COST,
        });
        return res.json({ success: true, dislike_count: post.dislike_count });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/:id/tip', auth_1.authenticateUser, async (req, res) => {
    try {
        const amount = parseFloat(req.body.amount);
        if (isNaN(amount) || amount < MIN_TIP) {
            return res.status(400).json({ success: false, error: `Minimum tip is ${MIN_TIP} ZP` });
        }
        const post = await Post_1.default.findById(req.params.id);
        if (!post)
            return res.status(404).json({ success: false, error: 'Post not found' });
        const creatorAmount = await (0, token_ledger_1.creatorShare)(amount);
        const feeAmount = (0, token_ledger_1.roundZP)(amount - creatorAmount);
        await (0, token_ledger_1.transferZP)(req.user.user_uid, post.author_uid, creatorAmount, 'tip', post._id, 'Post', {
            original_amount: amount,
            fee: feeAmount,
        });
        if (feeAmount > 0) {
            await (0, token_ledger_1.debitZP)(req.user.user_uid, feeAmount, 'platform_fee', post._id, 'Post');
        }
        post.tips_received += creatorAmount;
        post.trending_score = (0, trending_scorer_1.computeTrendingScore)(post);
        await post.save();
        await UserAction_1.default.create({
            user_uid: req.user.user_uid,
            post_uid: post._id,
            action_type: 'tip',
            token_amount: amount,
        });
        await UserActivity_1.default.create({
            user_uid: post.author_uid,
            event_type: 'post_tipped',
            actor_uid: req.user.user_uid,
            reference_id: post._id,
            reference_model: 'Post',
            metadata: { amount: creatorAmount },
        });
        await (0, gamification_service_1.addXP)(req.user.user_uid, 3, 'tip');
        await (0, gamification_service_1.addXP)(post.author_uid, 2, 'received_tip');
        await (0, mission_generator_1.updateMissionProgress)(req.user.user_uid, 'tip_creator', 1);
        const { getOrCreateGameStats } = require('../services/gamification-service');
        const authorStats = await getOrCreateGameStats(post.author_uid);
        authorStats.total_tips_received += creatorAmount;
        await authorStats.save();
        return res.json({
            success: true,
            tip_amount: creatorAmount,
            fee: feeAmount,
            tips_received: post.tips_received,
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/:id/reshare', auth_1.authenticateUser, async (req, res) => {
    try {
        const post = await Post_1.default.findById(req.params.id);
        if (!post)
            return res.status(404).json({ success: false, error: 'Post not found' });
        await (0, token_ledger_1.debitZP)(req.user.user_uid, RESHARE_COST, 'reshare_cost', post._id, 'Post');
        post.reshare_count += 1;
        post.trending_score = (0, trending_scorer_1.computeTrendingScore)(post);
        await post.save();
        await UserAction_1.default.create({
            user_uid: req.user.user_uid,
            post_uid: post._id,
            action_type: 'reshare',
            token_amount: RESHARE_COST,
        });
        await UserActivity_1.default.create({
            user_uid: post.author_uid,
            event_type: 'post_reshared',
            actor_uid: req.user.user_uid,
            reference_id: post._id,
            reference_model: 'Post',
        });
        await (0, gamification_service_1.addXP)(req.user.user_uid, 3, 'reshare');
        await (0, mission_generator_1.updateMissionProgress)(req.user.user_uid, 'reshare_post', 1);
        return res.json({ success: true, reshare_count: post.reshare_count });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/:id/boost', auth_1.authenticateUser, async (req, res) => {
    try {
        const amount = parseFloat(req.body.amount);
        if (isNaN(amount) || amount < MIN_BOOST) {
            return res.status(400).json({ success: false, error: `Minimum boost is ${MIN_BOOST} ZP` });
        }
        const post = await Post_1.default.findById(req.params.id);
        if (!post)
            return res.status(404).json({ success: false, error: 'Post not found' });
        const creatorAmount = await (0, token_ledger_1.creatorShare)(amount);
        const feeAmount = (0, token_ledger_1.roundZP)(amount - creatorAmount);
        await (0, token_ledger_1.transferZP)(req.user.user_uid, post.author_uid, creatorAmount, 'boost_cost', post._id, 'Post', {
            original_amount: amount,
            fee: feeAmount,
        });
        if (feeAmount > 0) {
            await (0, token_ledger_1.debitZP)(req.user.user_uid, feeAmount, 'platform_fee', post._id, 'Post');
        }
        const maxBoostWindowMs = 7 * 24 * 60 * 60 * 1000;
        const maxBoostAmount = 1000;
        const currentExpiry = post.boost_expires_at ? new Date(post.boost_expires_at) : null;
        const baseTime = currentExpiry && currentExpiry.getTime() > Date.now() ? currentExpiry.getTime() : Date.now();
        const boostExpires = new Date(Math.min(baseTime + BOOST_DURATION_HOURS * 60 * 60 * 1000, Date.now() + maxBoostWindowMs));
        post.is_boosted = true;
        post.boost_amount = Math.min((post.boost_amount || 0) + amount, maxBoostAmount);
        post.boost_expires_at = boostExpires;
        post.trending_score = (0, trending_scorer_1.computeTrendingScore)(post);
        await post.save();
        const boost = new SocialBoost_1.default({
            post_uid: post._id,
            booster_uid: req.user.user_uid,
            amount,
            expires_at: boostExpires,
        });
        await boost.save();
        await UserAction_1.default.create({
            user_uid: req.user.user_uid,
            post_uid: post._id,
            action_type: 'boost',
            token_amount: amount,
        });
        await UserActivity_1.default.create({
            user_uid: post.author_uid,
            event_type: 'post_boosted',
            actor_uid: req.user.user_uid,
            reference_id: post._id,
            reference_model: 'Post',
            metadata: { amount },
        });
        await (0, gamification_service_1.addXP)(req.user.user_uid, 5, 'boost');
        await (0, mission_generator_1.updateMissionProgress)(req.user.user_uid, 'boost_post', 1);
        return res.json({
            success: true,
            boost_amount: amount,
            boost_expires_at: boostExpires,
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/:id/report', auth_1.authenticateUser, async (req, res) => {
    try {
        if (!allowWrite(req.user.user_uid)) {
            return res.status(429).json({ success: false, error: 'Please wait a moment before reporting again' });
        }
        const post = await Post_1.default.findById(req.params.id);
        if (!post)
            return res.status(404).json({ success: false, error: 'Post not found' });
        const alreadyReported = await UserAction_1.default.findOne({
            user_uid: req.user.user_uid,
            post_uid: post._id,
            action_type: 'report',
        });
        if (alreadyReported)
            return res.status(400).json({ success: false, error: 'Already reported' });
        post.status = 'flagged';
        await post.save();
        await UserAction_1.default.create({
            user_uid: req.user.user_uid,
            post_uid: post._id,
            action_type: 'report',
        });
        return res.json({ success: true, message: 'Post flagged for moderation' });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/:id/comments', auth_1.authenticateUser, async (req, res) => {
    try {
        if (!allowWrite(req.user.user_uid)) {
            return res.status(429).json({ success: false, error: 'Please wait a moment before commenting again' });
        }
        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, error: 'Content is required' });
        }
        const parent = await Post_1.default.findById(req.params.id);
        if (!parent)
            return res.status(404).json({ success: false, error: 'Parent post not found' });
        const comment = new Post_1.default({
            author_uid: req.user.user_uid,
            content: content.trim(),
            content_type: 'comment',
            parent_id: parent._id,
            token_cost: 0,
        });
        await comment.save();
        parent.comment_count += 1;
        await parent.save();
        await UserActivity_1.default.create({
            user_uid: parent.author_uid,
            event_type: 'comment_added',
            actor_uid: req.user.user_uid,
            reference_id: comment._id,
            reference_model: 'Post',
        });
        await (0, gamification_service_1.addXP)(req.user.user_uid, 5, 'comment');
        await (0, mission_generator_1.updateMissionProgress)(req.user.user_uid, 'comment', 1);
        return res.json({ success: true, data: comment });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/:id/comments', auth_1.authenticateUser, async (req, res) => {
    try {
        const page = parseQueryParam(req.query.page, 1);
        const limit = Math.min(parseQueryParam(req.query.limit, 20), 50);
        const skip = (page - 1) * limit;
        const [comments, total] = await Promise.all([
            Post_1.default.find({
                content_type: 'comment',
                parent_id: req.params.id,
                status: { $ne: 'removed' },
            })
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Post_1.default.countDocuments({
                content_type: 'comment',
                parent_id: req.params.id,
                status: { $ne: 'removed' },
            }),
        ]);
        const enriched = await (0, post_enrich_1.enrichPostsWithAuthors)(comments, req.user.user_uid);
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
exports.default = router;
//# sourceMappingURL=social-posts.js.map