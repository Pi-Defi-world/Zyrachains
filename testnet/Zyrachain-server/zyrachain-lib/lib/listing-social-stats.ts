import {
  normalizeTwitterHandle,
  normalizeTelegramUsername,
  fetchTwitterPublicStats,
  fetchTelegramPublicStats,
  type TwitterPublicStats,
  type TelegramPublicStats,
} from './social-stats';
import { cachedSocialFetch } from './social-stats-cache';

export interface InfluencerSocialStats {
  twitterUsername: string | null;
  twitter: TwitterPublicStats | null;
  twitterError?: string;
}

export interface CommunitySocialStats {
  telegramUsername: string | null;
  telegram: TelegramPublicStats | null;
  telegramError?: string;
  twitterUsername: string | null;
  twitter: TwitterPublicStats | null;
  twitterError?: string;
}

/** Attach live X metrics (from stored `twitter` field). Uses shared TTL cache. */
export async function enrichInfluencerListings<T extends { twitter?: string }>(
  listings: T[]
): Promise<Array<T & { socialStats: InfluencerSocialStats }>> {
  const handles = [
    ...new Set(
      listings
        .map((l) => normalizeTwitterHandle(l.twitter))
        .filter((h): h is string => Boolean(h))
    ),
  ];

  const statsByHandle = new Map<string, TwitterPublicStats>();
  const errorsByHandle = new Map<string, string>();

  await Promise.all(
    handles.map(async (h) => {
      const r = await cachedSocialFetch(`tw:${h}`, () => fetchTwitterPublicStats(h));
      if (r.ok) statsByHandle.set(h, r.data);
      else errorsByHandle.set(h, r.error);
    })
  );

  return listings.map((l) => {
    const twitterUsername = normalizeTwitterHandle(l.twitter);
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

/** Attach live Telegram + Twitter metrics (from stored `telegram` + `twitter` fields). Uses shared TTL cache. */
export async function enrichCommunityListings<T extends { telegram?: string; twitter?: string }>(
  listings: T[]
): Promise<Array<T & { socialStats: CommunitySocialStats }>> {
  const tgUsernames = [
    ...new Set(
      listings
        .map((l) => normalizeTelegramUsername(l.telegram))
        .filter((u): u is string => Boolean(u))
    ),
  ];
  const twHandles = [
    ...new Set(
      listings
        .map((l) => normalizeTwitterHandle(l.twitter))
        .filter((h): h is string => Boolean(h))
    ),
  ];

  const tgStatsByUser = new Map<string, TelegramPublicStats>();
  const tgErrorsByUser = new Map<string, string>();
  const twStatsByHandle = new Map<string, TwitterPublicStats>();
  const twErrorsByHandle = new Map<string, string>();

  await Promise.all([
    ...tgUsernames.map(async (u) => {
      const key = u.toLowerCase();
      const r = await cachedSocialFetch(`tg:${key}`, () => fetchTelegramPublicStats(u));
      if (r.ok) tgStatsByUser.set(key, r.data);
      else tgErrorsByUser.set(key, r.error);
    }),
    ...twHandles.map(async (h) => {
      const r = await cachedSocialFetch(`tw:${h}`, () => fetchTwitterPublicStats(h));
      if (r.ok) twStatsByHandle.set(h, r.data);
      else twErrorsByHandle.set(h, r.error);
    }),
  ]);

  return listings.map((l) => {
    const telegramUsername = normalizeTelegramUsername(l.telegram);
    const twitterUsername = normalizeTwitterHandle(l.twitter);
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

/** Sort influencers by X followers (desc); rows without data sort last. */
export function sortInfluencersByTwitterFollowers<
  T extends { socialStats: InfluencerSocialStats }
>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      (b.socialStats.twitter?.followersCount ?? -1) -
      (a.socialStats.twitter?.followersCount ?? -1)
  );
}

/** Sort communities by Telegram member count (desc); null counts last. */
export function sortCommunitiesByTelegramMembers<
  T extends { socialStats: CommunitySocialStats }
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const mb = b.socialStats.telegram?.memberCount;
    const ma = a.socialStats.telegram?.memberCount;
    const nb = typeof mb === 'number' ? mb : -1;
    const na = typeof ma === 'number' ? ma : -1;
    return nb - na;
  });
}
