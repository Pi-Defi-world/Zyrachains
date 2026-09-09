import express, { Request, Response, Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import UserGameStats from '../zyrachain-lib/lib/models/UserGameStats';
import UserMission from '../zyrachain-lib/lib/models/UserMission';
import User from '../zyrachain-lib/lib/models/User';
import { getOrCreateGameStats, addXP, claimMission, getWeeklyLeaderboard } from '../services/gamification-service';
import { generateDailyMissionsForUser, getMissionPool } from '../services/mission-generator';

const router: Router = express.Router();

function parseQueryParam(val: any, fallback: number): number {
  const n = parseInt(val as string);
  return isNaN(n) || n < 1 ? fallback : n;
}

router.get('/stats', authenticateUser, async (req: any, res: Response) => {
  try {
    const stats = await getOrCreateGameStats(req.user.user_uid);
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
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/missions', authenticateUser, async (req: any, res: Response) => {
  try {
    let userMission = await generateDailyMissionsForUser(req.user.user_uid);
    const allMissions = await getMissionPool();
    const missionMap: Record<string, any> = {};
    for (const m of allMissions) missionMap[m.key] = m;

    const data = userMission.missions.map((m: any) => ({
      mission_key: m.mission_key,
      description: missionMap[m.mission_key]?.description || m.mission_key,
      progress: m.progress,
      target: m.target,
      completed: m.completed,
      claimed: m.claimed,
      reward: m.reward,
    }));

    return res.json({ success: true, data, mission_date: userMission.mission_date });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/missions/:key/claim', authenticateUser, async (req: any, res: Response) => {
  try {
    const result = await claimMission(req.user.user_uid, req.params.key);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/leaderboard', authenticateUser, async (req: any, res: Response) => {
  try {
    const page = parseQueryParam(req.query.page, 1);
    const limit = parseQueryParam(req.query.limit, 100);
    const { entries, total } = await getWeeklyLeaderboard(page, limit);

    const userUIDs = entries.map((e: any) => e.user_uid);
    const users = await User.find({ user_uid: { $in: userUIDs } })
      .select('user_uid piUsername avatar')
      .lean();
    const userMap: Record<string, any> = {};
    for (const u of users) userMap[u.user_uid] = u;

    const data = entries.map((e: any, i: number) => ({
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
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/streak', authenticateUser, async (req: any, res: Response) => {
  try {
    const stats = await getOrCreateGameStats(req.user.user_uid);
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
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
