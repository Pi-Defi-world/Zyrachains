"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const User_1 = __importDefault(require("../zyrachain-lib/lib/models/User"));
const gamification_service_1 = require("../services/gamification-service");
const mission_generator_1 = require("../services/mission-generator");
const router = express_1.default.Router();
function parseQueryParam(val, fallback) {
    const n = parseInt(val);
    return isNaN(n) || n < 1 ? fallback : n;
}
router.get('/stats', auth_1.authenticateUser, async (req, res) => {
    try {
        const stats = await (0, gamification_service_1.getOrCreateGameStats)(req.user.user_uid);
        const xpForNextLevel = Math.pow(stats.level + 1, 2) * 150;
        const xpCurrentLevel = Math.pow(stats.level, 2) * 150;
        const xpProgress = stats.xp - xpCurrentLevel;
        const xpNeeded = xpForNextLevel - xpCurrentLevel;
        return res.json({
            success: true,
            data: {
                xp: stats.xp,
                level: stats.level,
                xp_for_next_level: xpForNextLevel,
                xp_progress: xpProgress,
                xp_needed: xpNeeded,
                progress_percent: stats.level >= 50 ? 100 : Math.min(100, Math.round((xpProgress / xpNeeded) * 100)),
                streak_days: stats.streak_days,
                weekly_xp: stats.weekly_xp,
                total_missions_completed: stats.total_missions_completed,
                total_posts: stats.total_posts,
                total_likes_received: stats.total_likes_received,
                total_tips_received: stats.total_tips_received,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/missions', auth_1.authenticateUser, async (req, res) => {
    try {
        let userMission = await (0, mission_generator_1.generateDailyMissionsForUser)(req.user.user_uid);
        const allMissions = await (0, mission_generator_1.getMissionPool)();
        const missionMap = {};
        for (const m of allMissions)
            missionMap[m.key] = m;
        const data = userMission.missions.map((m) => ({
            mission_key: m.mission_key,
            description: missionMap[m.mission_key]?.description || m.mission_key,
            progress: m.progress,
            target: m.target,
            completed: m.completed,
            claimed: m.claimed,
            reward: m.reward,
        }));
        return res.json({ success: true, data, mission_date: userMission.mission_date });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/missions/:key/claim', auth_1.authenticateUser, async (req, res) => {
    try {
        const result = await (0, gamification_service_1.claimMission)(req.user.user_uid, req.params.key);
        return res.json({ success: true, ...result });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/leaderboard', auth_1.authenticateUser, async (req, res) => {
    try {
        const page = parseQueryParam(req.query.page, 1);
        const limit = parseQueryParam(req.query.limit, 100);
        const { entries, total } = await (0, gamification_service_1.getWeeklyLeaderboard)(page, limit);
        const userUIDs = entries.map((e) => e.user_uid);
        const users = await User_1.default.find({ user_uid: { $in: userUIDs } })
            .select('user_uid piUsername avatar')
            .lean();
        const userMap = {};
        for (const u of users)
            userMap[u.user_uid] = u;
        const data = entries.map((e, i) => ({
            rank: (page - 1) * limit + i + 1,
            user_uid: e.user_uid,
            username: userMap[e.user_uid]?.piUsername || 'Unknown',
            avatar: userMap[e.user_uid]?.avatar || null,
            xp: e.xp,
            level: e.level,
            weekly_xp: e.weekly_xp,
            streak_days: e.streak_days,
        }));
        return res.json({
            success: true,
            data,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/streak', auth_1.authenticateUser, async (req, res) => {
    try {
        const stats = await (0, gamification_service_1.getOrCreateGameStats)(req.user.user_uid);
        const { getNextStreakMilestone } = require('../services/platform-settings');
        const next = await getNextStreakMilestone(stats.streak_days);
        return res.json({
            success: true,
            data: {
                streak_days: stats.streak_days,
                last_active_date: stats.last_active_date,
                next_streak_bonus_at: next ? next.daysAway : null,
                next_streak_milestone: next ? { days: next.days, zp: next.zp } : null,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=social-gamification.js.map