"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateAndAwardBadges = evaluateAndAwardBadges;
exports.checkTriggerBadges = checkTriggerBadges;
exports.seedDefaultBadges = seedDefaultBadges;
const Badge_1 = __importDefault(require("../zyrachain-lib/lib/models/Badge"));
const UserBadge_1 = __importDefault(require("../zyrachain-lib/lib/models/UserBadge"));
const UserFollow_1 = __importDefault(require("../zyrachain-lib/lib/models/UserFollow"));
const Post_1 = __importDefault(require("../zyrachain-lib/lib/models/Post"));
const UserAction_1 = __importDefault(require("../zyrachain-lib/lib/models/UserAction"));
const UserActivity_1 = __importDefault(require("../zyrachain-lib/lib/models/UserActivity"));
const ModerationVote_1 = __importDefault(require("../zyrachain-lib/lib/models/ModerationVote"));
async function evaluateAndAwardBadges(userUID) {
    const allBadges = await Badge_1.default.find({ active: true }).lean();
    const userBadges = await UserBadge_1.default.find({ user_uid: userUID }).lean();
    const earnedKeys = new Set(userBadges.map((b) => b.badge_id.toString()));
    const followerCount = await UserFollow_1.default.countDocuments({ followed_uid: userUID });
    const postCount = await Post_1.default.countDocuments({ author_uid: userUID, content_type: 'post', status: { $ne: 'removed' } });
    const likeCount = await UserAction_1.default.countDocuments({ user_uid: userUID, action_type: 'like' });
    const moderationCount = await ModerationVote_1.default.countDocuments({ moderator_uid: userUID });
    const context = {
        followers: followerCount,
        posts: postCount,
        likes: likeCount,
        moderations: moderationCount,
    };
    const newBadges = [];
    for (const badge of allBadges) {
        if (earnedKeys.has(badge._id.toString()))
            continue;
        if (badge.category === 'paid')
            continue;
        const criteria = badge.criteria;
        let meets = true;
        for (const [key, target] of Object.entries(criteria)) {
            if ((context[key] || 0) < target) {
                meets = false;
                break;
            }
        }
        if (meets) {
            const userBadge = new UserBadge_1.default({
                user_uid: userUID,
                badge_id: badge._id,
                earned_at: new Date(),
            });
            await userBadge.save();
            newBadges.push(badge);
            await UserActivity_1.default.create({
                user_uid: userUID,
                event_type: 'badge_earned',
                actor_uid: userUID,
                reference_id: badge._id,
                reference_model: 'Badge',
                metadata: { badge_key: badge.badge_key, badge_name: badge.name },
            });
        }
    }
    return newBadges;
}
async function checkTriggerBadges(userUID, actionType) {
    try {
        await evaluateAndAwardBadges(userUID);
    }
    catch (err) {
        console.error('[badge-evaluator] Error evaluating badges:', err);
    }
}
async function seedDefaultBadges() {
    const existing = await Badge_1.default.countDocuments();
    if (existing > 0)
        return;
    const badges = [
        { badge_key: 'newcomer', name: 'Newcomer', description: 'Welcome to Zyra Social', icon: '👋', category: 'special', criteria: {}, tier: 1 },
        { badge_key: 'rising_star', name: 'Rising Star', description: 'Reached 10 followers', icon: '⭐', category: 'follower_based', criteria: { followers: 10 }, tier: 1 },
        { badge_key: 'popular', name: 'Popular', description: 'Reached 100 followers', icon: '🌟', category: 'follower_based', criteria: { followers: 100 }, tier: 2 },
        { badge_key: 'influencer', name: 'Influencer', description: 'Reached 1,000 followers', icon: '💫', category: 'follower_based', criteria: { followers: 1000 }, tier: 3 },
        { badge_key: 'mega_star', name: 'Mega Star', description: 'Reached 10,000 followers', icon: '👑', category: 'follower_based', criteria: { followers: 10000 }, tier: 4 },
        { badge_key: 'content_creator', name: 'Content Creator', description: 'Published 10 posts', icon: '✍️', category: 'achievement', criteria: { posts: 10 }, tier: 1 },
        { badge_key: 'prolific_creator', name: 'Prolific Creator', description: 'Published 50 posts', icon: '📝', category: 'achievement', criteria: { posts: 50 }, tier: 2 },
        { badge_key: 'curator', name: 'Curator', description: 'Liked 100 posts', icon: '👍', category: 'achievement', criteria: { likes: 100 }, tier: 2 },
        { badge_key: 'moderator', name: 'Moderator', description: 'Community moderator', icon: '🛡️', category: 'moderator', criteria: { moderations: 1 }, tier: 3 },
        { badge_key: 'premium', name: 'Premium', description: 'Premium member badge', icon: '💎', category: 'paid', criteria: {}, price: 50, tier: 2 },
        { badge_key: 'vip', name: 'VIP', description: 'VIP member badge', icon: '🏆', category: 'paid', criteria: {}, price: 200, tier: 3 },
        { badge_key: 'og', name: 'OG', description: 'Early adopter', icon: '🔥', category: 'paid', criteria: {}, price: 100, tier: 2 },
    ];
    await Badge_1.default.insertMany(badges);
    console.log(`[badge-evaluator] Seeded ${badges.length} default badges`);
}
//# sourceMappingURL=badge-evaluator.js.map