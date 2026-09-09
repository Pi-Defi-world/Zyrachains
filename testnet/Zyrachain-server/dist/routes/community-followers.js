"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const social_stats_1 = require("../zyrachain-lib/lib/social-stats");
const social_stats_cache_1 = require("../zyrachain-lib/lib/social-stats-cache");
const CommunityFollowerSnapshot_1 = __importDefault(require("../zyrachain-lib/lib/models/CommunityFollowerSnapshot"));
const router = express_1.default.Router();
function parseRange(req) {
    const range = req.query.range || '7d';
    const now = new Date();
    let from;
    switch (range) {
        case '1d':
            from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case '30d':
            from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '7d':
        default:
            from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
    }
    return { from };
}
router.get('/history', async (req, res) => {
    const raw = req.query.handle || '';
    if (!raw) {
        return res.status(400).json({ error: 'Missing ?handle= parameter' });
    }
    const handle = (0, social_stats_1.normalizeTwitterHandle)(raw);
    if (!handle) {
        return res.status(400).json({ error: 'Invalid Twitter handle' });
    }
    try {
        const { from } = parseRange(req);
        const snapshots = await CommunityFollowerSnapshot_1.default.find({
            handle: handle.toLowerCase(),
            fetchedAt: { $gte: from },
        })
            .sort({ fetchedAt: 1 })
            .select('followersCount followingCount tweetCount fetchedAt')
            .lean();
        const points = snapshots.map((s) => ({
            time: s.fetchedAt.toISOString(),
            followers: s.followersCount,
            following: s.followingCount,
            tweets: s.tweetCount,
        }));
        return res.json({ handle, range: req.query.range || '7d', total: points.length, data: points });
    }
    catch (error) {
        console.error('[community-followers] history error:', error);
        return res.status(500).json({ error: 'Failed to fetch follower history' });
    }
});
router.get('/stats', async (req, res) => {
    const raw = req.query.handle || '';
    if (!raw) {
        return res.status(400).json({ error: 'Missing ?handle= parameter' });
    }
    const handle = (0, social_stats_1.normalizeTwitterHandle)(raw);
    if (!handle) {
        return res.status(400).json({ error: 'Invalid Twitter handle' });
    }
    try {
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const latest = await CommunityFollowerSnapshot_1.default.findOne({ handle: handle.toLowerCase() })
            .sort({ fetchedAt: -1 })
            .select('followersCount followingCount tweetCount fetchedAt name')
            .lean();
        if (!latest) {
            return res.json({
                handle,
                current: null,
                growth: null,
                message: 'No snapshot data yet. Snapshots are taken periodically.',
            });
        }
        const oneDayAgo = await CommunityFollowerSnapshot_1.default.findOne({
            handle: handle.toLowerCase(),
            fetchedAt: { $lte: dayAgo },
        })
            .sort({ fetchedAt: -1 })
            .select('followersCount')
            .lean();
        const oneWeekAgo = await CommunityFollowerSnapshot_1.default.findOne({
            handle: handle.toLowerCase(),
            fetchedAt: { $lte: weekAgo },
        })
            .sort({ fetchedAt: -1 })
            .select('followersCount')
            .lean();
        const oneMonthAgo = await CommunityFollowerSnapshot_1.default.findOne({
            handle: handle.toLowerCase(),
            fetchedAt: { $lte: monthAgo },
        })
            .sort({ fetchedAt: -1 })
            .select('followersCount')
            .lean();
        const allSnaps = await CommunityFollowerSnapshot_1.default.find({ handle: handle.toLowerCase() })
            .sort({ followersCount: -1 })
            .select('followersCount fetchedAt')
            .lean();
        const current = latest.followersCount;
        const prev1d = oneDayAgo?.followersCount ?? null;
        const prev7d = oneWeekAgo?.followersCount ?? null;
        const prev30d = oneMonthAgo?.followersCount ?? null;
        const allTimeHigh = allSnaps.length > 0
            ? allSnaps.reduce((max, s) => Math.max(max, s.followersCount), 0)
            : current;
        const toPct = (curr, prev) => {
            if (prev == null || prev === 0)
                return null;
            return parseFloat((((curr - prev) / prev) * 100).toFixed(2));
        };
        const toAbs = (curr, prev) => {
            if (prev == null)
                return null;
            return curr - prev;
        };
        const firstSnapshot = allSnaps.length > 0 ? allSnaps[allSnaps.length - 1] : null;
        const totalGrowth = firstSnapshot ? toPct(current, firstSnapshot.followersCount) : null;
        const totalGrowthAbs = firstSnapshot ? toAbs(current, firstSnapshot.followersCount) : null;
        return res.json({
            handle,
            name: latest.name || handle,
            current: {
                followers: current,
                following: latest.followingCount ?? 0,
                tweets: latest.tweetCount ?? 0,
                fetchedAt: latest.fetchedAt?.toISOString() ?? null,
            },
            growth: {
                change1dAbs: toAbs(current, prev1d),
                change1dPct: toPct(current, prev1d),
                change7dAbs: toAbs(current, prev7d),
                change7dPct: toPct(current, prev7d),
                change30dAbs: toAbs(current, prev30d),
                change30dPct: toPct(current, prev30d),
                totalGrowthPct: totalGrowth,
                totalGrowthAbs: totalGrowthAbs,
            },
            allTimeHigh,
            snapshotCount: allSnaps.length,
        });
    }
    catch (error) {
        console.error('[community-followers] stats error:', error);
        return res.status(500).json({ error: 'Failed to fetch follower stats' });
    }
});
router.get('/overview', async (req, res) => {
    try {
        const communityCol = mongoose_1.default.connection.collection('communitylistings');
        const ecosystemCommunityCol = mongoose_1.default.connection.collection('communities');
        const influencerCol = mongoose_1.default.connection.collection('influencerlistings');
        const ecosystemInfluencerCol = mongoose_1.default.connection.collection('influencers');
        const [communityDocs, ecosystemDocs, influencerDocs, ecosystemInfluencerDocs] = await Promise.all([
            communityCol.find({ twitter: { $exists: true, $ne: '' }, status: 'approved' })
                .project({ name: 1, twitter: 1, category: 1 })
                .toArray(),
            ecosystemCommunityCol.find({})
                .project({ name: 1, Twitter: 1, twitter: 1, X: 1, x: 1, Website: 1, website: 1, Link: 1, link: 1, category: 1 })
                .toArray(),
            influencerCol.find({ twitter: { $exists: true, $ne: '' }, status: 'approved' })
                .project({ name: 1, twitter: 1, expertise: 1 })
                .toArray(),
            ecosystemInfluencerCol.find({})
                .project({ name: 1, Twitter: 1, twitter: 1, X: 1, x: 1, Website: 1, website: 1, Link: 1, link: 1, Category: 1, category: 1 })
                .toArray(),
        ]);
        const entries = [];
        for (const doc of communityDocs) {
            const h = (0, social_stats_1.normalizeTwitterHandle)(doc.twitter);
            if (h)
                entries.push({ listingId: doc._id?.toString() || '', name: doc.name || '', category: doc.category || '', handle: h });
        }
        for (const doc of ecosystemDocs) {
            let h = null;
            for (const k of ['Twitter', 'twitter', 'X', 'x']) {
                const v = doc[k];
                if (typeof v === 'string') {
                    h = (0, social_stats_1.normalizeTwitterHandle)(v);
                    if (h)
                        break;
                }
            }
            if (!h) {
                for (const k of ['Website', 'website', 'Link', 'link']) {
                    const v = doc[k];
                    if (typeof v === 'string' && /(twitter\.com|x\.com)\b/i.test(v)) {
                        h = (0, social_stats_1.normalizeTwitterHandle)(v);
                        if (h)
                            break;
                    }
                }
            }
            if (h)
                entries.push({ listingId: doc._id?.toString() || '', name: (doc.name || doc.Name || ''), category: (doc.category || doc.Category || ''), handle: h });
        }
        for (const doc of influencerDocs) {
            const h = (0, social_stats_1.normalizeTwitterHandle)(doc.twitter);
            if (h)
                entries.push({ listingId: doc._id?.toString() || '', name: doc.name || '', category: doc.expertise || 'Influencer', handle: h });
        }
        for (const doc of ecosystemInfluencerDocs) {
            let h = null;
            for (const k of ['Twitter', 'twitter', 'X', 'x']) {
                const v = doc[k];
                if (typeof v === 'string') {
                    h = (0, social_stats_1.normalizeTwitterHandle)(v);
                    if (h)
                        break;
                }
            }
            if (!h) {
                for (const k of ['Website', 'website', 'Link', 'link']) {
                    const v = doc[k];
                    if (typeof v === 'string' && /(twitter\.com|x\.com)\b/i.test(v)) {
                        h = (0, social_stats_1.normalizeTwitterHandle)(v);
                        if (h)
                            break;
                    }
                }
            }
            if (h)
                entries.push({ listingId: doc._id?.toString() || '', name: (doc.name || doc.Name || ''), category: (doc.Category || doc.category || 'Influencer'), handle: h });
        }
        const handles = [...new Set(entries.map((e) => e.handle))];
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const liveResults = await Promise.allSettled(handles.map(async (h) => {
            const r = await (0, social_stats_cache_1.cachedSocialFetch)(`tw:${h}`, () => (0, social_stats_1.fetchTwitterPublicStats)(h));
            if (!r.ok)
                return { handle: h, error: r.error };
            const prevDay = await CommunityFollowerSnapshot_1.default.findOne({
                handle: h.toLowerCase(),
                fetchedAt: { $lte: dayAgo },
            })
                .sort({ fetchedAt: -1 })
                .select('followersCount')
                .lean();
            const prevWeek = await CommunityFollowerSnapshot_1.default.findOne({
                handle: h.toLowerCase(),
                fetchedAt: { $lte: weekAgo },
            })
                .sort({ fetchedAt: -1 })
                .select('followersCount')
                .lean();
            return {
                handle: h,
                name: r.data.name,
                followersCount: r.data.followersCount,
                followingCount: r.data.followingCount,
                tweetCount: r.data.tweetCount,
                profileImageUrl: r.data.profileImageUrl,
                verified: r.data.verified,
                prevDayFollowers: prevDay?.followersCount ?? null,
                prevWeekFollowers: prevWeek?.followersCount ?? null,
                fetchedAt: r.data.fetchedAt,
            };
        }));
        const liveMap = new Map();
        for (const r of liveResults) {
            if (r.status === 'fulfilled')
                liveMap.set(r.value.handle, r.value);
        }
        const result = entries.map((entry) => {
            const live = liveMap.get(entry.handle);
            const followers = live?.followersCount ?? null;
            const prevDay = live?.prevDayFollowers ?? null;
            const prevWeek = live?.prevWeekFollowers ?? null;
            const toPct = (curr, prev) => {
                if (prev == null || prev === 0)
                    return null;
                return parseFloat((((curr - prev) / prev) * 100).toFixed(2));
            };
            return {
                listingId: entry.listingId,
                name: entry.name,
                category: entry.category,
                handle: entry.handle,
                followers,
                followingCount: live?.followingCount ?? null,
                tweetCount: live?.tweetCount ?? null,
                profileImageUrl: live?.profileImageUrl ?? null,
                verified: live?.verified ?? null,
                change24hAbs: followers != null && prevDay != null ? followers - prevDay : null,
                change24hPct: followers != null ? toPct(followers, prevDay) : null,
                change7dAbs: followers != null && prevWeek != null ? followers - prevWeek : null,
                change7dPct: followers != null ? toPct(followers, prevWeek) : null,
                error: live?.error ?? null,
                fetchedAt: live?.fetchedAt ?? null,
            };
        });
        const totalFollowers = result.reduce((sum, r) => sum + (typeof r.followers === 'number' ? r.followers : 0), 0);
        return res.json({
            total: result.length,
            totalFollowers,
            communities: result.sort((a, b) => (b.followers ?? -1) - (a.followers ?? -1)),
        });
    }
    catch (error) {
        console.error('[community-followers] overview error:', error);
        return res.status(500).json({ error: 'Failed to fetch community overview' });
    }
});
exports.default = router;
//# sourceMappingURL=community-followers.js.map