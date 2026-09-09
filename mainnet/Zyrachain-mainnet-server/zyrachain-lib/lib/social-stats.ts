/**
 * Live public stats from X (Twitter) and Telegram using official APIs.
 *
 * Env:
 *   TWITTER_BEARER_TOKEN — X API v2 app-only bearer (Developer Portal)
 *   TELEGRAM_BOT_TOKEN — from @BotFather (bot does not need to be admin for public @username getChat)
 *
 * You still STORE usernames/handles on listings; these functions fetch current metrics on demand
 * (use caching at the route layer to protect rate limits).
 */

import axios from 'axios';

/** Strip URLs / @ to get X handle (1–15 chars, alphanumeric + underscore). */
export function normalizeTwitterHandle(input: string | undefined | null): string | null {
  if (!input || typeof input !== 'string') return null;
  let s = input.trim();
  s = s.replace(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\//i, '');
  s = s.replace(/^@/, '');
  s = s.split('/')[0]?.split('?')[0] ?? '';
  s = s.replace(/\/$/, '');
  if (!/^[a-z0-9_]{1,15}$/i.test(s)) return null;
  return s.toLowerCase();
}

/** Strip t.me / @ for public channel or group username. */
export function normalizeTelegramUsername(input: string | undefined | null): string | null {
  if (!input || typeof input !== 'string') return null;
  let s = input.trim();
  s = s.replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '');
  s = s.replace(/^@/, '');
  s = s.split('/')[0]?.split('?')[0] ?? '';
  s = s.replace(/\/$/, '');
  if (!/^[a-z][a-z0-9_]{3,31}$/i.test(s)) return null;
  return s;
}

export interface TwitterPublicStats {
  username: string;
  name: string;
  id: string;
  profileImageUrl?: string;
  verified?: boolean;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  listedCount?: number;
  fetchedAt: string;
}

export interface TelegramPublicStats {
  username: string;
  title?: string;
  type?: string;
  memberCount: number | null;
  description?: string;
  fetchedAt: string;
}

export async function fetchTwitterPublicStats(
  handle: string
): Promise<{ ok: true; data: TwitterPublicStats } | { ok: false; error: string; code?: string }> {
  const token = process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN;
  if (!token) {
    return { ok: false, error: 'TWITTER_BEARER_TOKEN not configured on server' };
  }

  const url = `https://api.twitter.com/2/users/by/username/${encodeURIComponent(handle)}`;
  try {
    const { data, status } = await axios.get(url, {
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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { ok: false, error: msg, code: 'NETWORK' };
  }
}

export async function fetchTelegramPublicStats(
  username: string
): Promise<{ ok: true; data: TelegramPublicStats } | { ok: false; error: string; code?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured on server' };
  }

  const base = `https://api.telegram.org/bot${token}`;
  const chatId = `@${username}`;

  try {
    const chatRes = await axios.get(`${base}/getChat`, {
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
    let memberCount: number | null = null;
    const countRes = await axios
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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { ok: false, error: msg, code: 'NETWORK' };
  }
}
