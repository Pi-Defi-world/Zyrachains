"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeTrendingScore = computeTrendingScore;
exports.runTrendingScorer = runTrendingScorer;
exports.getTrendingFeed = getTrendingFeed;
exports.getFollowingFeed = getFollowingFeed;
exports.getNewFeed = getNewFeed;
const Post_1 = __importDefault(require("../zyrachain-lib/lib/models/Post"));
function computeTrendingScore(post) {
    const now = Date.now();
    const ageMs = now - new Date(post.createdAt).getTime();
    const ageHours = Math.max(ageMs / (1000 * 60 * 60), 0.1);
    const engagement = (post.tips_received || 0) * 5 +
        (post.like_count || 0) * 2 +
        (post.comment_count || 0) * 1.5 +
        (post.reshare_count || 0) * 3 +
        (post.impression_count || 0) * 0.01;
    const boostScore = post.is_boosted ? Math.min(post.boost_amount || 0, 1000) / 10 : 0;
    return (engagement + boostScore) / Math.pow(ageHours + 2, 1.5);
}
async function runTrendingScorer() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const posts = await Post_1.default.find({
        content_type: 'post',
        status: 'active',
        createdAt: { $gte: sevenDaysAgo },
    }).lean();
    const bulkOps = posts
        .map((post) => {
        const score = computeTrendingScore(post);
        if (Math.abs((post.trending_score || 0) - score) < 1e-9)
            return null;
        return {
            updateOne: {
                filter: { _id: post._id },
                update: { $set: { trending_score: score } },
            },
        };
    })
        .filter(Boolean);
    if (bulkOps.length > 0) {
        await Post_1.default.bulkWrite(bulkOps);
    }
    console.log(`[trending-scorer] Scored ${posts.length} posts (${bulkOps.length} updated)`);
}
async function getTrendingFeed(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query = { content_type: 'post', status: 'active' };
    const [posts, total] = await Promise.all([
        Post_1.default.find(query)
            .sort({ trending_score: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Post_1.default.countDocuments(query),
    ]);
    return { posts, total };
}
async function getFollowingFeed(userUID, followedUIDs, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const authorUIDs = [...followedUIDs, userUID];
    const query = {
        content_type: 'post',
        status: 'active',
        author_uid: { $in: authorUIDs },
    };
    const [posts, total] = await Promise.all([
        Post_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Post_1.default.countDocuments(query),
    ]);
    return { posts, total };
}
async function getNewFeed(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query = { content_type: 'post', status: 'active' };
    const [posts, total] = await Promise.all([
        Post_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Post_1.default.countDocuments(query),
    ]);
    return { posts, total };
}
//# sourceMappingURL=trending-scorer.js.map