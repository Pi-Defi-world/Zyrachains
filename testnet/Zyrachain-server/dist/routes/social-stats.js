"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const InfluencerListing_1 = __importDefault(require("../zyrachain-lib/lib/models/InfluencerListing"));
const CommunityListing_1 = __importDefault(require("../zyrachain-lib/lib/models/CommunityListing"));
const social_stats_1 = require("../zyrachain-lib/lib/social-stats");
const social_stats_cache_1 = require("../zyrachain-lib/lib/social-stats-cache");
const router = express_1.default.Router();
function cached(key, fn) {
    return (0, social_stats_cache_1.cachedSocialFetch)(key, fn);
}
router.get('/twitter', async (req, res) => {
    const raw = req.query.handle || req.query.username || '';
    const handle = (0, social_stats_1.normalizeTwitterHandle)(raw);
    if (!handle) {
        return res.status(400).json({ error: 'Invalid or missing handle', hint: 'Use ?handle=user or full x.com URL' });
    }
    const result = await cached(`tw:${handle}`, () => (0, social_stats_1.fetchTwitterPublicStats)(handle));
    if (!result.ok) {
        const status = result.code === 'NOT_FOUND' ? 404 : result.code === 'AUTH' ? 503 : 502;
        return res.status(status).json({ error: result.error, code: result.code });
    }
    return res.json(result.data);
});
router.get('/telegram', async (req, res) => {
    const raw = req.query.username || req.query.handle || '';
    const username = (0, social_stats_1.normalizeTelegramUsername)(raw);
    if (!username) {
        return res.status(400).json({ error: 'Invalid or missing username', hint: 'Use ?username=mychannel or t.me/mychannel' });
    }
    const result = await cached(`tg:${username.toLowerCase()}`, () => (0, social_stats_1.fetchTelegramPublicStats)(username));
    if (!result.ok) {
        const status = result.code === 'NOT_FOUND' ? 404 : 502;
        return res.status(status).json({ error: result.error, code: result.code });
    }
    return res.json(result.data);
});
router.get('/batch', async (req, res) => {
    const twRaw = req.query.twitter || '';
    const tgRaw = req.query.telegram || '';
    const twHandles = twRaw
        .split(',')
        .map((s) => (0, social_stats_1.normalizeTwitterHandle)(s.trim()))
        .filter(Boolean);
    const tgUsers = tgRaw
        .split(',')
        .map((s) => (0, social_stats_1.normalizeTelegramUsername)(s.trim()))
        .filter(Boolean);
    if (twHandles.length === 0 && tgUsers.length === 0) {
        return res.status(400).json({ error: 'Provide twitter= and/or telegram= comma-separated lists' });
    }
    const twitter = {};
    const telegram = {};
    const errors = {};
    for (const h of twHandles.slice(0, 10)) {
        const r = await cached(`tw:${h}`, () => (0, social_stats_1.fetchTwitterPublicStats)(h));
        if (r.ok)
            twitter[h] = r.data;
        else
            errors[`twitter:${h}`] = r.error;
    }
    for (const u of tgUsers.slice(0, 10)) {
        const r = await cached(`tg:${u.toLowerCase()}`, () => (0, social_stats_1.fetchTelegramPublicStats)(u));
        if (r.ok)
            telegram[u] = r.data;
        else
            errors[`telegram:${u}`] = r.error;
    }
    return res.json({ twitter, telegram, errors: Object.keys(errors).length ? errors : undefined });
});
router.get('/listing/influencer/:id', async (req, res) => {
    const raw = await InfluencerListing_1.default.findById(req.params.id).lean();
    if (!raw || Array.isArray(raw)) {
        return res.status(404).json({ error: 'Influencer listing not found' });
    }
    const doc = raw;
    const handle = (0, social_stats_1.normalizeTwitterHandle)(doc.twitter);
    let twitterStats = null;
    let twitterError;
    if (handle) {
        const r = await cached(`tw:${handle}`, () => (0, social_stats_1.fetchTwitterPublicStats)(handle));
        if (r.ok)
            twitterStats = r.data;
        else
            twitterError = r.error;
    }
    return res.json({
        listingId: doc._id,
        name: doc.name,
        status: doc.status,
        twitterRaw: doc.twitter ?? null,
        twitterUsername: handle,
        twitterStats,
        twitterError,
    });
});
router.get('/listing/community/:id', async (req, res) => {
    const raw = await CommunityListing_1.default.findById(req.params.id).lean();
    if (!raw || Array.isArray(raw)) {
        return res.status(404).json({ error: 'Community listing not found' });
    }
    const doc = raw;
    const username = (0, social_stats_1.normalizeTelegramUsername)(doc.telegram);
    let telegramStats = null;
    let telegramError;
    if (username) {
        const r = await cached(`tg:${username.toLowerCase()}`, () => (0, social_stats_1.fetchTelegramPublicStats)(username));
        if (r.ok)
            telegramStats = r.data;
        else
            telegramError = r.error;
    }
    return res.json({
        listingId: doc._id,
        name: doc.name,
        status: doc.status,
        telegramRaw: doc.telegram ?? null,
        telegramUsername: username,
        telegramStats,
        telegramError,
    });
});
exports.default = router;
//# sourceMappingURL=social-stats.js.map