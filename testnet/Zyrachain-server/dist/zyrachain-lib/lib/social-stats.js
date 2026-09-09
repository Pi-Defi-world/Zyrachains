"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTwitterHandle = normalizeTwitterHandle;
exports.normalizeTelegramUsername = normalizeTelegramUsername;
exports.fetchTwitterPublicStats = fetchTwitterPublicStats;
exports.fetchTelegramPublicStats = fetchTelegramPublicStats;
const axios_1 = __importDefault(require("axios"));
function normalizeTwitterHandle(input) {
    if (!input || typeof input !== 'string')
        return null;
    let s = input.trim();
    s = s.replace(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\//i, '');
    s = s.replace(/^@/, '');
    s = s.split('/')[0]?.split('?')[0] ?? '';
    s = s.replace(/\/$/, '');
    if (!/^[a-z0-9_]{1,15}$/i.test(s))
        return null;
    return s.toLowerCase();
}
function normalizeTelegramUsername(input) {
    if (!input || typeof input !== 'string')
        return null;
    let s = input.trim();
    s = s.replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '');
    s = s.replace(/^@/, '');
    s = s.split('/')[0]?.split('?')[0] ?? '';
    s = s.replace(/\/$/, '');
    if (!/^[a-z][a-z0-9_]{3,31}$/i.test(s))
        return null;
    return s;
}
async function fetchTwitterPublicStats(handle) {
    const token = process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN;
    if (!token) {
        return { ok: false, error: 'TWITTER_BEARER_TOKEN not configured on server' };
    }
    const url = `https://api.twitter.com/2/users/by/username/${encodeURIComponent(handle)}`;
    try {
        const { data, status } = await axios_1.default.get(url, {
            headers: { Authorization: `Bearer ${token}` },
            params: {
                'user.fields': 'public_metrics,profile_image_url,verified,description',
            },
            validateStatus: () => true,
        });
        if (status === 404) {
            return { ok: false, error: 'User not found', code: 'NOT_FOUND' };
        }
        if (status === 401 || status === 403) {
            return { ok: false, error: 'X API rejected the request (check token / plan)', code: 'AUTH' };
        }
        if (status !== 200 || !data?.data) {
            return {
                ok: false,
                error: data?.errors?.[0]?.detail || data?.title || `X API error (${status})`,
                code: 'API_ERROR',
            };
        }
        const u = data.data;
        const m = u.public_metrics || {};
        return {
            ok: true,
            data: {
                username: u.username,
                name: u.name,
                id: u.id,
                profileImageUrl: u.profile_image_url,
                verified: u.verified,
                followersCount: m.followers_count ?? 0,
                followingCount: m.following_count ?? 0,
                tweetCount: m.tweet_count ?? 0,
                listedCount: m.listed_count,
                fetchedAt: new Date().toISOString(),
            },
        };
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        return { ok: false, error: msg, code: 'NETWORK' };
    }
}
async function fetchTelegramPublicStats(username) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured on server' };
    }
    const base = `https://api.telegram.org/bot${token}`;
    const chatId = `@${username}`;
    try {
        const chatRes = await axios_1.default.get(`${base}/getChat`, {
            params: { chat_id: chatId },
            validateStatus: () => true,
        });
        if (!chatRes.data?.ok) {
            const desc = chatRes.data?.description || 'getChat failed';
            return {
                ok: false,
                error: desc,
                code: chatRes.data?.error_code === 400 ? 'NOT_FOUND' : 'API_ERROR',
            };
        }
        const chat = chatRes.data.result;
        let memberCount = null;
        const countRes = await axios_1.default
            .get(`${base}/getChatMemberCount`, { params: { chat_id: chatId }, validateStatus: () => true })
            .catch(() => null);
        if (countRes?.data?.ok && typeof countRes.data.result === 'number') {
            memberCount = countRes.data.result;
        }
        return {
            ok: true,
            data: {
                username: chat.username || username,
                title: chat.title,
                type: chat.type,
                memberCount,
                description: chat.description,
                fetchedAt: new Date().toISOString(),
            },
        };
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        return { ok: false, error: msg, code: 'NETWORK' };
    }
}
//# sourceMappingURL=social-stats.js.map