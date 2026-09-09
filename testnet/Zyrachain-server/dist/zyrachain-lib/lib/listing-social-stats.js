"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichInfluencerListings = enrichInfluencerListings;
exports.enrichCommunityListings = enrichCommunityListings;
exports.sortInfluencersByTwitterFollowers = sortInfluencersByTwitterFollowers;
exports.sortCommunitiesByTelegramMembers = sortCommunitiesByTelegramMembers;
const social_stats_1 = require("./social-stats");
const social_stats_cache_1 = require("./social-stats-cache");
async function enrichInfluencerListings(listings) {
    const handles = [
        ...new Set(listings
            .map((l) => (0, social_stats_1.normalizeTwitterHandle)(l.twitter))
            .filter((h) => Boolean(h))),
    ];
    const statsByHandle = new Map();
    const errorsByHandle = new Map();
    await Promise.all(handles.map(async (h) => {
        const r = await (0, social_stats_cache_1.cachedSocialFetch)(`tw:${h}`, () => (0, social_stats_1.fetchTwitterPublicStats)(h));
        if (r.ok)
            statsByHandle.set(h, r.data);
        else
            errorsByHandle.set(h, r.error);
    }));
    return listings.map((l) => {
        const twitterUsername = (0, social_stats_1.normalizeTwitterHandle)(l.twitter);
        const h = twitterUsername || '';
        return {
            ...l,
            socialStats: {
                twitterUsername,
                twitter: twitterUsername ? statsByHandle.get(h) ?? null : null,
                twitterError: twitterUsername ? errorsByHandle.get(h) : undefined,
            },
        };
    });
}
async function enrichCommunityListings(listings) {
    const tgUsernames = [
        ...new Set(listings
            .map((l) => (0, social_stats_1.normalizeTelegramUsername)(l.telegram))
            .filter((u) => Boolean(u))),
    ];
    const twHandles = [
        ...new Set(listings
            .map((l) => (0, social_stats_1.normalizeTwitterHandle)(l.twitter))
            .filter((h) => Boolean(h))),
    ];
    const tgStatsByUser = new Map();
    const tgErrorsByUser = new Map();
    const twStatsByHandle = new Map();
    const twErrorsByHandle = new Map();
    await Promise.all([
        ...tgUsernames.map(async (u) => {
            const key = u.toLowerCase();
            const r = await (0, social_stats_cache_1.cachedSocialFetch)(`tg:${key}`, () => (0, social_stats_1.fetchTelegramPublicStats)(u));
            if (r.ok)
                tgStatsByUser.set(key, r.data);
            else
                tgErrorsByUser.set(key, r.error);
        }),
        ...twHandles.map(async (h) => {
            const r = await (0, social_stats_cache_1.cachedSocialFetch)(`tw:${h}`, () => (0, social_stats_1.fetchTwitterPublicStats)(h));
            if (r.ok)
                twStatsByHandle.set(h, r.data);
            else
                twErrorsByHandle.set(h, r.error);
        }),
    ]);
    return listings.map((l) => {
        const telegramUsername = (0, social_stats_1.normalizeTelegramUsername)(l.telegram);
        const twitterUsername = (0, social_stats_1.normalizeTwitterHandle)(l.twitter);
        const tgKey = telegramUsername ? telegramUsername.toLowerCase() : '';
        return {
            ...l,
            socialStats: {
                telegramUsername,
                telegram: telegramUsername ? tgStatsByUser.get(tgKey) ?? null : null,
                telegramError: telegramUsername ? tgErrorsByUser.get(tgKey) : undefined,
                twitterUsername,
                twitter: twitterUsername ? twStatsByHandle.get(twitterUsername) ?? null : null,
                twitterError: twitterUsername ? twErrorsByHandle.get(twitterUsername) : undefined,
            },
        };
    });
}
function sortInfluencersByTwitterFollowers(rows) {
    return [...rows].sort((a, b) => (b.socialStats.twitter?.followersCount ?? -1) -
        (a.socialStats.twitter?.followersCount ?? -1));
}
function sortCommunitiesByTelegramMembers(rows) {
    return [...rows].sort((a, b) => {
        const mb = b.socialStats.telegram?.memberCount;
        const ma = a.socialStats.telegram?.memberCount;
        const nb = typeof mb === 'number' ? mb : -1;
        const na = typeof ma === 'number' ? ma : -1;
        return nb - na;
    });
}
//# sourceMappingURL=listing-social-stats.js.map