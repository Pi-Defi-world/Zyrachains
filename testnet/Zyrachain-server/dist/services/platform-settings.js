"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SETTINGS = void 0;
exports.getSetting = getSetting;
exports.setSetting = setSetting;
exports.getAllSettings = getAllSettings;
exports.getConversionRate = getConversionRate;
exports.getPlatformFeeRate = getPlatformFeeRate;
exports.getReferralReward = getReferralReward;
exports.getStreakMilestones = getStreakMilestones;
exports.getNextStreakMilestone = getNextStreakMilestone;
const PlatformSetting_1 = __importDefault(require("../zyrachain-lib/lib/models/PlatformSetting"));
exports.DEFAULT_SETTINGS = {
    zp_per_pi: 10,
    platform_fee_rate: 0.2,
    referral_reward_zp: 1,
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
const cache = new Map();
const CACHE_TTL_MS = 30 * 1000;
function invalidate(key) {
    cache.delete(key);
}
async function getSetting(key, fallback) {
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
    }
    let value = fallback;
    try {
        const doc = (await PlatformSetting_1.default.findOne({ key }).lean());
        if (doc && doc.value !== undefined) {
            value = doc.value;
        }
    }
    catch (err) {
        console.error(`[platform-settings] failed to read "${key}":`, err);
    }
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
}
async function setSetting(key, value, updatedBy) {
    await PlatformSetting_1.default.findOneAndUpdate({ key }, { key, value, updatedBy }, { upsert: true, new: true, setDefaultsOnInsert: true });
    invalidate(key);
}
async function getAllSettings() {
    const settings = { ...exports.DEFAULT_SETTINGS };
    try {
        const docs = (await PlatformSetting_1.default.find({}).lean());
        for (const doc of docs) {
            settings[doc.key] = doc.value;
        }
    }
    catch (err) {
        console.error('[platform-settings] failed to list settings:', err);
    }
    return settings;
}
async function getConversionRate() {
    const rate = await getSetting('zp_per_pi', exports.DEFAULT_SETTINGS.zp_per_pi);
    return typeof rate === 'number' && rate > 0 ? rate : exports.DEFAULT_SETTINGS.zp_per_pi;
}
async function getPlatformFeeRate() {
    const rate = await getSetting('platform_fee_rate', exports.DEFAULT_SETTINGS.platform_fee_rate);
    return typeof rate === 'number' && rate >= 0 && rate < 1 ? rate : exports.DEFAULT_SETTINGS.platform_fee_rate;
}
async function getReferralReward() {
    const reward = await getSetting('referral_reward_zp', exports.DEFAULT_SETTINGS.referral_reward_zp);
    return typeof reward === 'number' && reward >= 0 ? reward : exports.DEFAULT_SETTINGS.referral_reward_zp;
}
async function getStreakMilestones() {
    const milestones = await getSetting('streak_milestones', exports.DEFAULT_SETTINGS.streak_milestones);
    if (!Array.isArray(milestones))
        return exports.DEFAULT_SETTINGS.streak_milestones;
    return milestones
        .filter((m) => m && typeof m.days === 'number' && m.days > 0 && typeof m.zp === 'number' && m.zp > 0)
        .sort((a, b) => a.days - b.days);
}
async function getNextStreakMilestone(streakDays) {
    const milestones = await getStreakMilestones();
    const next = milestones.find((m) => m.days > streakDays);
    if (!next)
        return null;
    return { ...next, daysAway: next.days - streakDays };
}
//# sourceMappingURL=platform-settings.js.map