import PlatformSetting from '../zyrachain-lib/lib/models/PlatformSetting';

export const DEFAULT_SETTINGS: Record<string, any> = {
  // 1 Pi buys this many ZP (admin-configurable; default 10 ZP per Pi)
  zp_per_pi: 10,
  // Platform share of content earnings (tips / boosts); creator gets the rest
  platform_fee_rate: 0.2,
  // ZP rewarded to a user for each successfully referred new user
  referral_reward_zp: 1,
  // Streak milestones: ZP is only awarded when the streak hits one of these day counts
  streak_milestones: [
    { days: 7, zp: 2 },
    { days: 14, zp: 5 },
    { days: 30, zp: 10 },
    { days: 60, zp: 20 },
    { days: 90, zp: 30 },
    { days: 180, zp: 50 },
    { days: 365, zp: 100 },
  ],
};

const cache = new Map<string, { value: any; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 1000;

function invalidate(key: string): void {
  cache.delete(key);
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  let value: any = fallback;
  try {
    const doc = (await PlatformSetting.findOne({ key }).lean()) as unknown as {
      value: any;
    } | null;
    if (doc && doc.value !== undefined) {
      value = doc.value;
    }
  } catch (err) {
    console.error(`[platform-settings] failed to read "${key}":`, err);
  }

  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value as T;
}

export async function setSetting(key: string, value: any, updatedBy: string): Promise<void> {
  await PlatformSetting.findOneAndUpdate(
    { key },
    { key, value, updatedBy },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  invalidate(key);
}

export async function getAllSettings(): Promise<Record<string, any>> {
  const settings: Record<string, any> = { ...DEFAULT_SETTINGS };
  try {
    const docs = (await PlatformSetting.find({}).lean()) as unknown as Array<{
      key: string;
      value: any;
    }>;
    for (const doc of docs) {
      settings[doc.key] = doc.value;
    }
  } catch (err) {
    console.error('[platform-settings] failed to list settings:', err);
  }
  return settings;
}

export async function getConversionRate(): Promise<number> {
  const rate = await getSetting<number>('zp_per_pi', DEFAULT_SETTINGS.zp_per_pi);
  return typeof rate === 'number' && rate > 0 ? rate : DEFAULT_SETTINGS.zp_per_pi;
}

export async function getPlatformFeeRate(): Promise<number> {
  const rate = await getSetting<number>('platform_fee_rate', DEFAULT_SETTINGS.platform_fee_rate);
  return typeof rate === 'number' && rate >= 0 && rate < 1 ? rate : DEFAULT_SETTINGS.platform_fee_rate;
}

export async function getReferralReward(): Promise<number> {
  const reward = await getSetting<number>('referral_reward_zp', DEFAULT_SETTINGS.referral_reward_zp);
  return typeof reward === 'number' && reward >= 0 ? reward : DEFAULT_SETTINGS.referral_reward_zp;
}

export async function getStreakMilestones(): Promise<Array<{ days: number; zp: number }>> {
  const milestones = await getSetting<Array<{ days: number; zp: number }>>(
    'streak_milestones',
    DEFAULT_SETTINGS.streak_milestones
  );
  if (!Array.isArray(milestones)) return DEFAULT_SETTINGS.streak_milestones;
  return milestones
    .filter((m) => m && typeof m.days === 'number' && m.days > 0 && typeof m.zp === 'number' && m.zp > 0)
    .sort((a, b) => a.days - b.days);
}

export async function getNextStreakMilestone(
  streakDays: number
): Promise<{ days: number; zp: number; daysAway: number } | null> {
  const milestones = await getStreakMilestones();
  const next = milestones.find((m) => m.days > streakDays);
  if (!next) return null;
  return { ...next, daysAway: next.days - streakDays };
}
