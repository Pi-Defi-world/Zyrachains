import express, { Request, Response, Router } from 'express';
import InfluencerListing, {
  type IInfluencerListing,
} from '../zyrachain-lib/lib/models/InfluencerListing';
import CommunityListing, {
  type ICommunityListing,
} from '../zyrachain-lib/lib/models/CommunityListing';
import {
  normalizeTwitterHandle,
  normalizeTelegramUsername,
  fetchTwitterPublicStats,
  fetchTelegramPublicStats,
} from '../zyrachain-lib/lib/social-stats';
import { cachedSocialFetch } from '../zyrachain-lib/lib/social-stats-cache';

const router: Router = express.Router();

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  return cachedSocialFetch(key, fn);
}

/**
 * GET /api/social-stats/twitter?handle=username_or_url
 * Live follower / tweet counts from X API v2 (requires TWITTER_BEARER_TOKEN).
 */
router.get('/twitter', async (req: Request, res: Response) => {
  const raw = (req.query.handle as string) || (req.query.username as string) || '';
  const handle = normalizeTwitterHandle(raw);
  if (!handle) {
    return res.status(400).json({ error: 'Invalid or missing handle', hint: 'Use ?handle=user or full x.com URL' });
  }

  const result = await cached(`tw:${handle}`, () => fetchTwitterPublicStats(handle));
  if (!result.ok) {
    const status = result.code === 'NOT_FOUND' ? 404 : result.code === 'AUTH' ? 503 : 502;
    return res.status(status).json({ error: result.error, code: result.code });
  }
  return res.json(result.data);
});

/**
 * GET /api/social-stats/telegram?username=channel_or_url
 * Public chat info + member count when Telegram allows (requires TELEGRAM_BOT_TOKEN).
 */
router.get('/telegram', async (req: Request, res: Response) => {
  const raw = (req.query.username as string) || (req.query.handle as string) || '';
  const username = normalizeTelegramUsername(raw);
  if (!username) {
    return res.status(400).json({ error: 'Invalid or missing username', hint: 'Use ?username=mychannel or t.me/mychannel' });
  }

  const result = await cached(`tg:${username.toLowerCase()}`, () => fetchTelegramPublicStats(username));
  if (!result.ok) {
    const status = result.code === 'NOT_FOUND' ? 404 : 502;
    return res.status(status).json({ error: result.error, code: result.code });
  }
  return res.json(result.data);
});

/**
 * GET /api/social-stats/batch?twitter=a,b&telegram=c,d
 * Multiple handles in one request (still respects cache).
 */
router.get('/batch', async (req: Request, res: Response) => {
  const twRaw = (req.query.twitter as string) || '';
  const tgRaw = (req.query.telegram as string) || '';
  const twHandles = twRaw
    .split(',')
    .map((s) => normalizeTwitterHandle(s.trim()))
    .filter(Boolean) as string[];
  const tgUsers = tgRaw
    .split(',')
    .map((s) => normalizeTelegramUsername(s.trim()))
    .filter(Boolean) as string[];

  if (twHandles.length === 0 && tgUsers.length === 0) {
    return res.status(400).json({ error: 'Provide twitter= and/or telegram= comma-separated lists' });
  }

  const twitter: Record<string, unknown> = {};
  const telegram: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const h of twHandles.slice(0, 10)) {
    const r = await cached(`tw:${h}`, () => fetchTwitterPublicStats(h));
    if (r.ok) twitter[h] = r.data;
    else errors[`twitter:${h}`] = r.error;
  }
  for (const u of tgUsers.slice(0, 10)) {
    const r = await cached(`tg:${u.toLowerCase()}`, () => fetchTelegramPublicStats(u));
    if (r.ok) telegram[u] = r.data;
    else errors[`telegram:${u}`] = r.error;
  }

  return res.json({ twitter, telegram, errors: Object.keys(errors).length ? errors : undefined });
});

/**
 * GET /api/social-stats/listing/influencer/:id
 * Stored listing twitter field + live X stats (for cards / ranking).
 */
router.get('/listing/influencer/:id', async (req: Request, res: Response) => {
  const raw = await InfluencerListing.findById(req.params.id).lean();
  if (!raw || Array.isArray(raw)) {
    return res.status(404).json({ error: 'Influencer listing not found' });
  }
  const doc = raw as unknown as IInfluencerListing & { _id: unknown };

  const handle = normalizeTwitterHandle(doc.twitter);
  let twitterStats = null;
  let twitterError: string | undefined;
  if (handle) {
    const r = await cached(`tw:${handle}`, () => fetchTwitterPublicStats(handle));
    if (r.ok) twitterStats = r.data;
    else twitterError = r.error;
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

/**
 * GET /api/social-stats/listing/community/:id
 * Stored telegram field + live Telegram stats.
 */
router.get('/listing/community/:id', async (req: Request, res: Response) => {
  const raw = await CommunityListing.findById(req.params.id).lean();
  if (!raw || Array.isArray(raw)) {
    return res.status(404).json({ error: 'Community listing not found' });
  }
  const doc = raw as unknown as ICommunityListing & { _id: unknown };

  const username = normalizeTelegramUsername(doc.telegram);
  let telegramStats = null;
  let telegramError: string | undefined;
  if (username) {
    const r = await cached(`tg:${username.toLowerCase()}`, () => fetchTelegramPublicStats(username));
    if (r.ok) telegramStats = r.data;
    else telegramError = r.error;
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

export default router;
