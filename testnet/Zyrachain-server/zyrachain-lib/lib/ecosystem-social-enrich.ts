/**
 * Live Telegram / X stats for legacy ecosystem collections (`communities`, `influencers`).
 * Extracts handles from common document fields + Website URLs (t.me / x.com / twitter.com).
 */

import {
  normalizeTwitterHandle,
  normalizeTelegramUsername,
  fetchTwitterPublicStats,
  fetchTelegramPublicStats,
  type TwitterPublicStats,
  type TelegramPublicStats,
} from './social-stats';
import { cachedSocialFetch } from './social-stats-cache';

export function telegramHandleFromCommunityDoc(doc: Record<string, unknown>): string | null {
  const directKeys = ['Telegram', 'telegram', 'TelegramLink', 'telegramLink', 'tg', 'TG'];
  for (const k of directKeys) {
    const v = doc[k];
    if (typeof v === 'string') {
      const u = normalizeTelegramUsername(v);
      if (u) return u;
    }
  }
  const urlKeys = ['Website', 'website', 'Link', 'link'];
  for (const k of urlKeys) {
    const v = doc[k];
    if (typeof v === 'string' && /t\.me|telegram\.me/i.test(v)) {
      const u = normalizeTelegramUsername(v);
      if (u) return u;
    }
  }
  return null;
}

export function twitterHandleFromInfluencerDoc(doc: Record<string, unknown>): string | null {
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
      const h = normalizeTwitterHandle(v);
      if (h) return h;
    }
  }
  const urlKeys = ['Website', 'website', 'Link', 'link'];
  for (const k of urlKeys) {
    const v = doc[k];
    if (typeof v === 'string' && /(twitter\.com|x\.com)\b/i.test(v)) {
      const h = normalizeTwitterHandle(v);
      if (h) return h;
    }
  }
  return null;
}

function storedMembers(doc: Record<string, unknown>): number {
  const m = doc.Members ?? doc.members;
  return typeof m === 'number' && !Number.isNaN(m) ? m : 0;
}

function storedFollowers(doc: Record<string, unknown>): number {
  const f = doc.Followers ?? doc.followers;
  return typeof f === 'number' && !Number.isNaN(f) ? f : 0;
}

export async function enrichEcosystemCommunityDocuments(
  docs: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  const rows = docs.map((d) => ({ d, tg: telegramHandleFromCommunityDoc(d) }));
  const users = [...new Set(rows.map((r) => r.tg).filter((x): x is string => Boolean(x)))];
  const statsByUser = new Map<string, TelegramPublicStats>();
  const errByUser = new Map<string, string>();
  await Promise.all(
    users.map(async (u) => {
      const key = u.toLowerCase();
      const r = await cachedSocialFetch(`tg:${key}`, () => fetchTelegramPublicStats(u));
      if (r.ok) statsByUser.set(key, r.data);
      else errByUser.set(key, r.error);
    })
  );

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

export async function enrichEcosystemInfluencerDocuments(
  docs: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  const rows = docs.map((d) => ({ d, tw: twitterHandleFromInfluencerDoc(d) }));
  const handles = [...new Set(rows.map((r) => r.tw).filter((x): x is string => Boolean(x)))];
  const statsByHandle = new Map<string, TwitterPublicStats>();
  const errByHandle = new Map<string, string>();
  await Promise.all(
    handles.map(async (h) => {
      const r = await cachedSocialFetch(`tw:${h}`, () => fetchTwitterPublicStats(h));
      if (r.ok) statsByHandle.set(h, r.data);
      else errByHandle.set(h, r.error);
    })
  );

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

export function sortEcosystemCommunitiesByMembers(docs: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...docs].sort((a, b) => (Number(b.Members) || 0) - (Number(a.Members) || 0));
}

export function sortEcosystemInfluencersByFollowers(docs: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...docs].sort((a, b) => (Number(b.Followers) || 0) - (Number(a.Followers) || 0));
}
