"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCommunityFollowerSnapshotter = startCommunityFollowerSnapshotter;
const mongoose_1 = __importDefault(require("mongoose"));
const social_stats_1 = require("../zyrachain-lib/lib/social-stats");
const CommunityFollowerSnapshot_1 = __importDefault(require("../zyrachain-lib/lib/models/CommunityFollowerSnapshot"));
let timer = null;
let inFlight = false;
function pollMs() {
    return Math.max(300000, Number(process.env.COMMUNITY_SNAPSHOT_POLL_MS || 2592000000));
}
function rateLimitDelayMs() {
    return Math.max(2000, Number(process.env.COMMUNITY_SNAPSHOT_RATE_LIMIT_MS || 5000));
}
async function loadTrackedHandles() {
    const communityCol = mongoose_1.default.connection.collection('communitylistings');
    const ecosystemCommunityCol = mongoose_1.default.connection.collection('communities');
    const influencerCol = mongoose_1.default.connection.collection('influencerlistings');
    const ecosystemInfluencerCol = mongoose_1.default.connection.collection('influencers');
    const [communityDocs, ecosystemDocs, influencerDocs, ecosystemInfluencerDocs] = await Promise.all([
        communityCol.find({ twitter: { $exists: true, $ne: '' }, status: 'approved' })
            .project({ twitter: 1, name: 1 })
            .toArray(),
        ecosystemCommunityCol.find({})
            .project({ name: 1, Twitter: 1, twitter: 1, X: 1, x: 1, Website: 1, website: 1, Link: 1, link: 1 })
            .toArray(),
        influencerCol.find({ twitter: { $exists: true, $ne: '' }, status: 'approved' })
            .project({ twitter: 1, name: 1 })
            .toArray(),
        ecosystemInfluencerCol.find({})
            .project({ name: 1, Twitter: 1, twitter: 1, X: 1, x: 1, Website: 1, website: 1, Link: 1, link: 1 })
            .toArray(),
    ]);
    const seen = new Set();
    const result = [];
    function add(h, source, name) {
        if (!h || seen.has(h))
            return;
        seen.add(h);
        result.push({ handle: h, source, name });
    }
    for (const doc of communityDocs) {
        add((0, social_stats_1.normalizeTwitterHandle)(doc.twitter), 'communitylisting', doc.name || '');
    }
    for (const doc of ecosystemDocs) {
        const name = (doc.name || doc.Name || '');
        for (const k of ['Twitter', 'twitter', 'X', 'x', 'TwitterHandle', 'twitterHandle']) {
            const v = doc[k];
            if (typeof v === 'string') {
                const h = (0, social_stats_1.normalizeTwitterHandle)(v);
                if (h) {
                    add(h, 'ecosystem-community', name);
                    break;
                }
            }
        }
        for (const k of ['Website', 'website', 'Link', 'link']) {
            const v = doc[k];
            if (typeof v === 'string' && /(twitter\.com|x\.com)\b/i.test(v)) {
                const h = (0, social_stats_1.normalizeTwitterHandle)(v);
                if (h) {
                    add(h, 'ecosystem-community', name);
                    break;
                }
            }
        }
    }
    for (const doc of influencerDocs) {
        add((0, social_stats_1.normalizeTwitterHandle)(doc.twitter), 'influencerlisting', doc.name || '');
    }
    for (const doc of ecosystemInfluencerDocs) {
        const name = (doc.name || doc.Name || '');
        for (const k of ['Twitter', 'twitter', 'X', 'x', 'TwitterHandle', 'twitterHandle', 'XHandle', 'xHandle']) {
            const v = doc[k];
            if (typeof v === 'string') {
                const h = (0, social_stats_1.normalizeTwitterHandle)(v);
                if (h) {
                    add(h, 'ecosystem-influencer', name);
                    break;
                }
            }
        }
        for (const k of ['Website', 'website', 'Link', 'link']) {
            const v = doc[k];
            if (typeof v === 'string' && /(twitter\.com|x\.com)\b/i.test(v)) {
                const h = (0, social_stats_1.normalizeTwitterHandle)(v);
                if (h) {
                    add(h, 'ecosystem-influencer', name);
                    break;
                }
            }
        }
    }
    return result;
}
async function runOneCycle() {
    try {
        const entries = await loadTrackedHandles();
        if (entries.length === 0) {
            console.log('[community-snapshotter] no tracked handles found across all collections');
            return;
        }
        console.log(`[community-snapshotter] discovered ${entries.length} handle(s):`);
        entries.forEach((e) => console.log(`  @${e.handle} (${e.source}: ${e.name})`));
        let saved = 0;
        let failed = 0;
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (i > 0) {
                await new Promise((resolve) => setTimeout(resolve, rateLimitDelayMs()));
            }
            const r = await (0, social_stats_1.fetchTwitterPublicStats)(entry.handle);
            if (!r.ok) {
                console.warn(`[community-snapshotter] @${entry.handle}: ${r.error}`);
                failed++;
                continue;
            }
            const snapshot = new CommunityFollowerSnapshot_1.default({
                handle: r.data.username,
                name: r.data.name,
                followersCount: r.data.followersCount,
                followingCount: r.data.followingCount,
                tweetCount: r.data.tweetCount,
                fetchedAt: new Date(),
            });
            await snapshot.save();
            console.log(`[community-snapshotter] @${entry.handle}: ${r.data.followersCount.toLocaleString()} followers saved`);
            saved++;
        }
        console.log(`[community-snapshotter] cycle complete: ${saved}/${entries.length} saved, ${failed} failed`);
        console.log(`[community-snapshotter] X API calls used: ${entries.length} (out of ~100 free-tier limit)`);
    }
    catch (error) {
        console.error('[community-snapshotter] cycle failed:', error);
    }
}
function startCommunityFollowerSnapshotter() {
    if (process.env.COMMUNITY_SNAPSHOT_ENABLED === 'false') {
        console.log('[community-snapshotter] disabled (COMMUNITY_SNAPSHOT_ENABLED=false)');
        return;
    }
    if (timer)
        return;
    const interval = pollMs();
    const days = Math.round(interval / (24 * 60 * 60 * 1000));
    console.log(`[community-snapshotter] starting (poll=~${days}d, ~${days > 0 ? 'once per ' + days + ' day(s)' : interval + 'ms'})`);
    const tick = async () => {
        if (inFlight)
            return;
        inFlight = true;
        try {
            await runOneCycle();
        }
        catch (error) {
            console.error('[community-snapshotter] tick failed:', error);
        }
        finally {
            inFlight = false;
        }
    };
    setTimeout(() => { void tick(); }, 10000);
    timer = setInterval(() => {
        void tick();
    }, Math.max(60000, interval));
}
//# sourceMappingURL=community-follower-snapshotter.js.map