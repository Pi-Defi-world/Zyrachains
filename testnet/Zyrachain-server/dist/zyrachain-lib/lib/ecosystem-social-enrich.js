"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramHandleFromCommunityDoc = telegramHandleFromCommunityDoc;
exports.twitterHandleFromInfluencerDoc = twitterHandleFromInfluencerDoc;
exports.enrichEcosystemCommunityDocuments = enrichEcosystemCommunityDocuments;
exports.enrichEcosystemInfluencerDocuments = enrichEcosystemInfluencerDocuments;
exports.sortEcosystemCommunitiesByMembers = sortEcosystemCommunitiesByMembers;
exports.sortEcosystemInfluencersByFollowers = sortEcosystemInfluencersByFollowers;
const social_stats_1 = require("./social-stats");
const social_stats_cache_1 = require("./social-stats-cache");
function telegramHandleFromCommunityDoc(doc) {
    const directKeys = ['Telegram', 'telegram', 'TelegramLink', 'telegramLink', 'tg', 'TG'];
    for (const k of directKeys) {
        const v = doc[k];
        if (typeof v === 'string') {
            const u = (0, social_stats_1.normalizeTelegramUsername)(v);
            if (u)
                return u;
        }
    }
    const urlKeys = ['Website', 'website', 'Link', 'link'];
    for (const k of urlKeys) {
        const v = doc[k];
        if (typeof v === 'string' && /t\.me|telegram\.me/i.test(v)) {
            const u = (0, social_stats_1.normalizeTelegramUsername)(v);
            if (u)
                return u;
        }
    }
    return null;
}
function twitterHandleFromInfluencerDoc(doc) {
    const directKeys = [
        'Twitter',
        'twitter',
        'TwitterHandle',
        'twitterHandle',
        'XHandle',
        'xHandle',
        'X',
        'x',
        'TwitterUrl',
        'twitterUrl',
    ];
    for (const k of directKeys) {
        const v = doc[k];
        if (typeof v === 'string') {
            const h = (0, social_stats_1.normalizeTwitterHandle)(v);
            if (h)
                return h;
        }
    }
    const urlKeys = ['Website', 'website', 'Link', 'link'];
    for (const k of urlKeys) {
        const v = doc[k];
        if (typeof v === 'string' && /(twitter\.com|x\.com)\b/i.test(v)) {
            const h = (0, social_stats_1.normalizeTwitterHandle)(v);
            if (h)
                return h;
        }
    }
    return null;
}
function storedMembers(doc) {
    const m = doc.Members ?? doc.members;
    return typeof m === 'number' && !Number.isNaN(m) ? m : 0;
}
function storedFollowers(doc) {
    const f = doc.Followers ?? doc.followers;
    return typeof f === 'number' && !Number.isNaN(f) ? f : 0;
}
async function enrichEcosystemCommunityDocuments(docs) {
    const rows = docs.map((d) => ({ d, tg: telegramHandleFromCommunityDoc(d) }));
    const users = [...new Set(rows.map((r) => r.tg).filter((x) => Boolean(x)))];
    const statsByUser = new Map();
    const errByUser = new Map();
    await Promise.all(users.map(async (u) => {
        const key = u.toLowerCase();
        const r = await (0, social_stats_cache_1.cachedSocialFetch)(`tg:${key}`, () => (0, social_stats_1.fetchTelegramPublicStats)(u));
        if (r.ok)
            statsByUser.set(key, r.data);
        else
            errByUser.set(key, r.error);
    }));
    return rows.map(({ d, tg }) => {
        const key = tg ? tg.toLowerCase() : '';
        const live = tg ? statsByUser.get(key) ?? null : null;
        const liveCount = typeof live?.memberCount === 'number' ? live.memberCount : null;
        const stored = storedMembers(d);
        return {
            ...d,
            Members: liveCount ?? stored,
            MembersStored: stored,
            socialStats: {
                telegramUsername: tg,
                memberCountLive: liveCount,
                telegram: live,
                telegramError: tg ? errByUser.get(key) : undefined,
                source: liveCount !== null ? 'live' : 'stored',
            },
        };
    });
}
async function enrichEcosystemInfluencerDocuments(docs) {
    const rows = docs.map((d) => ({ d, tw: twitterHandleFromInfluencerDoc(d) }));
    const handles = [...new Set(rows.map((r) => r.tw).filter((x) => Boolean(x)))];
    const statsByHandle = new Map();
    const errByHandle = new Map();
    await Promise.all(handles.map(async (h) => {
        const r = await (0, social_stats_cache_1.cachedSocialFetch)(`tw:${h}`, () => (0, social_stats_1.fetchTwitterPublicStats)(h));
        if (r.ok)
            statsByHandle.set(h, r.data);
        else
            errByHandle.set(h, r.error);
    }));
    return rows.map(({ d, tw }) => {
        const live = tw ? statsByHandle.get(tw) ?? null : null;
        const liveCount = typeof live?.followersCount === 'number' ? live.followersCount : null;
        const stored = storedFollowers(d);
        return {
            ...d,
            Followers: liveCount ?? stored,
            FollowersStored: stored,
            socialStats: {
                twitterUsername: tw,
                followersLive: liveCount,
                twitter: live,
                twitterError: tw ? errByHandle.get(tw) : undefined,
                source: liveCount !== null ? 'live' : 'stored',
            },
        };
    });
}
function sortEcosystemCommunitiesByMembers(docs) {
    return [...docs].sort((a, b) => (Number(b.Members) || 0) - (Number(a.Members) || 0));
}
function sortEcosystemInfluencersByFollowers(docs) {
    return [...docs].sort((a, b) => (Number(b.Followers) || 0) - (Number(a.Followers) || 0));
}
//# sourceMappingURL=ecosystem-social-enrich.js.map