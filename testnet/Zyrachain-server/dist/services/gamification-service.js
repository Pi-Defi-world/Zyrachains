"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateGameStats = getOrCreateGameStats;
exports.addXP = addXP;
exports.claimMission = claimMission;
exports.getWeeklyLeaderboard = getWeeklyLeaderboard;
const UserGameStats_1 = __importDefault(require("../zyrachain-lib/lib/models/UserGameStats"));
const UserMission_1 = __importDefault(require("../zyrachain-lib/lib/models/UserMission"));
const token_ledger_1 = require("./token-ledger");
const badge_evaluator_1 = require("./badge-evaluator");
const platform_settings_1 = require("./platform-settings");
const XP_TO_LEVEL = (level) => Math.pow(level, 2) * 150;
async function getOrCreateGameStats(userUID) {
    let stats = await UserGameStats_1.default.findOne({ user_uid: userUID });
    if (!stats) {
        stats = new UserGameStats_1.default({ user_uid: userUID });
        await stats.save();
    }
    return stats;
}
async function addXP(userUID, xpAmount, detail = '') {
    const stats = await getOrCreateGameStats(userUID);
    stats.xp += xpAmount;
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    const lastActive = stats.last_active_date ? new Date(stats.last_active_date) : null;
    if (lastActive) {
        lastActive.setUTCHours(0, 0, 0, 0);
        const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
        }
        else if (diffDays === 1) {
            stats.streak_days += 1;
            const milestones = await (0, platform_settings_1.getStreakMilestones)();
            const milestone = milestones.find((m) => m.days === stats.streak_days);
            if (milestone) {
                const streakBonus = 50;
                stats.xp += streakBonus;
                await (0, token_ledger_1.creditZP)(userUID, milestone.zp, 'mission_reward', 'earned', null, '', {
                    description: `${stats.streak_days}-day streak bonus`,
                });
            }
        }
        else {
            stats.streak_days = 1;
        }
    }
    else {
        stats.streak_days = 1;
    }
    stats.last_active_date = new Date();
    const currentMonday = new Date(now);
    const day = currentMonday.getUTCDay();
    const diff = currentMonday.getUTCDate() - day + (day === 0 ? -6 : 1);
    currentMonday.setUTCDate(diff);
    if (!stats.weekly_reset_at || new Date(stats.weekly_reset_at) < currentMonday) {
        stats.weekly_xp = 0;
        stats.weekly_reset_at = currentMonday;
    }
    stats.weekly_xp += xpAmount;
    let leveledUp = false;
    let newLevel = null;
    while (stats.xp >= XP_TO_LEVEL(stats.level + 1) && stats.level < 50) {
        stats.level += 1;
        leveledUp = true;
        newLevel = stats.level;
    }
    await stats.save();
    if (leveledUp && newLevel) {
        const UserActivity = require('../zyrachain-lib/lib/models/UserActivity').default;
        await UserActivity.create({
            user_uid: userUID,
            event_type: 'level_up',
            actor_uid: userUID,
            metadata: { new_level: newLevel, detail },
        }).catch(() => { });
        await (0, badge_evaluator_1.checkTriggerBadges)(userUID, 'level_up');
    }
    return { xp: stats.xp, level: stats.level, leveledUp, newLevel };
}
async function claimMission(userUID, missionKey) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const userMission = await UserMission_1.default.findOne({ user_uid: userUID, mission_date: today });
    if (!userMission) {
        return { claimed: false, reward: 0, missions: [] };
    }
    let reward = 0;
    for (const mission of userMission.missions) {
        if (mission.mission_key === missionKey && mission.completed && !mission.claimed) {
            mission.claimed = true;
            reward = mission.reward;
            break;
        }
    }
    if (reward > 0) {
        await userMission.save();
        await (0, token_ledger_1.creditZP)(userUID, reward, 'mission_reward', 'earned', null, '', {
            description: `Mission reward: ${missionKey}`,
        });
        await addXP(userUID, 10, `mission_${missionKey}`);
        const stats = await getOrCreateGameStats(userUID);
        stats.total_missions_completed += 1;
        await stats.save();
        const UserActivity = require('../zyrachain-lib/lib/models/UserActivity').default;
        await UserActivity.create({
            user_uid: userUID,
            event_type: 'mission_completed',
            actor_uid: userUID,
            metadata: { mission_key: missionKey, reward },
        }).catch(() => { });
    }
    return { claimed: reward > 0, reward, missions: userMission.missions };
}
async function getWeeklyLeaderboard(page = 1, limit = 100) {
    const skip = (page - 1) * limit;
    const currentMonday = new Date();
    currentMonday.setUTCHours(0, 0, 0, 0);
    const day = currentMonday.getUTCDay();
    const diff = currentMonday.getUTCDate() - day + (day === 0 ? -6 : 1);
    currentMonday.setUTCDate(diff);
    const [entries, total] = await Promise.all([
        UserGameStats_1.default.find({ weekly_reset_at: currentMonday })
            .sort({ weekly_xp: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        UserGameStats_1.default.countDocuments({ weekly_reset_at: currentMonday }),
    ]);
    return { entries, total };
}
//# sourceMappingURL=gamification-service.js.map