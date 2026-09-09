"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichPostsWithAuthors = enrichPostsWithAuthors;
exports.enrichPostWithAuthor = enrichPostWithAuthor;
const User_1 = __importDefault(require("../zyrachain-lib/lib/models/User"));
const UserFollow_1 = __importDefault(require("../zyrachain-lib/lib/models/UserFollow"));
async function enrichPostsWithAuthors(posts, viewerUID) {
    if (!posts || posts.length === 0)
        return posts;
    const authorUIDs = Array.from(new Set(posts.map((p) => p.author_uid).filter(Boolean)));
    if (authorUIDs.length === 0)
        return posts;
    const users = await User_1.default.find({ user_uid: { $in: authorUIDs } })
        .select('user_uid piUsername avatar bio')
        .lean();
    const userMap = {};
    for (const u of users)
        userMap[u.user_uid] = u;
    let followedSet = new Set();
    if (viewerUID) {
        const follows = await UserFollow_1.default.find({ follower_uid: viewerUID }).select('followed_uid').lean();
        followedSet = new Set(follows.map((f) => String(f.followed_uid)));
    }
    return posts.map((post) => {
        const author = userMap[post.author_uid] || null;
        return {
            ...post,
            author_username: author?.piUsername || null,
            author_avatar: author?.avatar || null,
            author_bio: author?.bio || null,
            author_uid: post.author_uid,
            viewer_following: viewerUID ? followedSet.has(post.author_uid) : false,
        };
    });
}
async function enrichPostWithAuthor(post, viewerUID) {
    if (!post)
        return post;
    const [enriched] = await enrichPostsWithAuthors([post], viewerUID);
    return enriched;
}
//# sourceMappingURL=post-enrich.js.map