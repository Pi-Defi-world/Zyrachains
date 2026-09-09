import express, { Request, Response, Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import UserFollow from '../zyrachain-lib/lib/models/UserFollow';
import UserActivity from '../zyrachain-lib/lib/models/UserActivity';
import UserBadge from '../zyrachain-lib/lib/models/UserBadge';
import Post from '../zyrachain-lib/lib/models/Post';
import User from '../zyrachain-lib/lib/models/User';
import { getOrCreateGameStats } from '../services/gamification-service';
import { getTokenAccount } from '../services/token-ledger';
import { addXP } from '../services/gamification-service';
import { updateMissionProgress } from '../services/mission-generator';
import { enrichPostsWithAuthors } from '../services/post-enrich';

const router: Router = express.Router();

function parseQueryParam(val: any, fallback: number): number {
  const n = parseInt(val as string);
  return isNaN(n) || n < 1 ? fallback : n;
}

router.patch('/me/profile', authenticateUser, async (req: any, res: Response) => {
  try {
    const { avatar, bio } = req.body || {};

    const updates: any = {};

    if (avatar !== undefined) {
      if (avatar === null || avatar === '') {
        updates.avatar = null;
      } else {
        if (typeof avatar !== 'string') {
          return res.status(400).json({ success: false, error: 'Avatar must be a string URL' });
        }
        if (avatar.length > 1000) {
          return res.status(400).json({ success: false, error: 'Avatar URL is too long' });
        }
        if (!/^(https?:\/\/|\/)/i.test(avatar)) {
          return res.status(400).json({ success: false, error: 'Avatar must be a valid URL or upload path' });
        }
        updates.avatar = avatar;
      }
    }

    if (bio !== undefined) {
      if (typeof bio !== 'string') {
        return res.status(400).json({ success: false, error: 'Bio must be a string' });
      }
      if (bio.length > 500) {
        return res.status(400).json({ success: false, error: 'Bio cannot exceed 500 characters' });
      }
      updates.bio = bio.trim().length ? bio.trim() : null;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.json({
      success: true,
      data: {
        uid: user?.user_uid,
        username: user?.piUsername,
        avatar: user?.avatar ?? null,
        bio: user?.bio ?? null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:uid/profile', authenticateUser, async (req: any, res: Response) => {
  try {
    const targetUID = req.params.uid;
    const user: any = await User.findOne({ user_uid: targetUID }).lean();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const [followerCount, followingCount, postCount, account, gameStats, badges] = await Promise.all([
      UserFollow.countDocuments({ followed_uid: targetUID }),
      UserFollow.countDocuments({ follower_uid: targetUID }),
      Post.countDocuments({ author_uid: targetUID, content_type: 'post', status: { $ne: 'removed' } }),
      getTokenAccount(targetUID).catch(() => null),
      getOrCreateGameStats(targetUID).catch(() => null),
      UserBadge.find({ user_uid: targetUID }).populate('badge_id').lean(),
    ]);

    const isFollowing = targetUID !== req.user.user_uid
      ? !!(await UserFollow.findOne({ follower_uid: req.user.user_uid, followed_uid: targetUID }))
      : false;

    return res.json({
      success: true,
      data: {
        uid: user.user_uid,
        username: user.piUsername,
        avatar: user.avatar,
        bio: user.bio,
        follower_count: followerCount,
        following_count: followingCount,
        post_count: postCount,
        balance: account ? account.balance : 0,
        xp: gameStats ? gameStats.xp : 0,
        level: gameStats ? gameStats.level : 1,
        streak_days: gameStats ? gameStats.streak_days : 0,
        badges: badges.map((b: any) => ({
          badge_key: b.badge_id?.badge_key || '',
          name: b.badge_id?.name || '',
          icon: b.badge_id?.icon || '',
          earned_at: b.earned_at,
        })),
        is_following: isFollowing,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:uid/follow', authenticateUser, async (req: any, res: Response) => {
  try {
    const targetUID = req.params.uid;
    if (targetUID === req.user.user_uid) {
      return res.status(400).json({ success: false, error: 'Cannot follow yourself' });
    }

    const targetUser = await User.findOne({ user_uid: targetUID });
    if (!targetUser) return res.status(404).json({ success: false, error: 'User not found' });

    const existing = await UserFollow.findOne({
      follower_uid: req.user.user_uid,
      followed_uid: targetUID,
    });
    if (existing) return res.status(400).json({ success: false, error: 'Already following' });

    const follow = new UserFollow({
      follower_uid: req.user.user_uid,
      followed_uid: targetUID,
    });
    await follow.save();

    const followerCount = await UserFollow.countDocuments({ followed_uid: targetUID });

    await UserActivity.create({
      user_uid: targetUID,
      event_type: 'user_followed',
      actor_uid: req.user.user_uid,
      reference_model: 'UserFollow',
      reference_id: follow._id,
      metadata: { follower_count: followerCount },
    });

    await addXP(req.user.user_uid, 1, 'follow');
    await addXP(targetUID, 3, 'received_follow');
    await updateMissionProgress(req.user.user_uid, 'follow_users', 1);
    await updateMissionProgress(targetUID, 'gain_follower', 1);

    const { checkTriggerBadges } = require('../services/badge-evaluator');
    await checkTriggerBadges(targetUID, 'followed');

    return res.json({ success: true, follower_count: followerCount });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:uid/follow', authenticateUser, async (req: any, res: Response) => {
  try {
    const targetUID = req.params.uid;
    const result = await UserFollow.deleteOne({
      follower_uid: req.user.user_uid,
      followed_uid: targetUID,
    });

    const followerCount = await UserFollow.countDocuments({ followed_uid: targetUID });

    return res.json({
      success: true,
      unfollowed: result.deletedCount > 0,
      follower_count: followerCount,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:uid/followers', authenticateUser, async (req: any, res: Response) => {
  try {
    const page = parseQueryParam(req.query.page, 1);
    const limit = parseQueryParam(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      UserFollow.find({ followed_uid: req.params.uid })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserFollow.countDocuments({ followed_uid: req.params.uid }),
    ]);

    const followerUIDs = followers.map((f) => f.follower_uid);
    const users = await User.find({ user_uid: { $in: followerUIDs } }).select('user_uid piUsername avatar').lean();
    const userMap: Record<string, any> = {};
    for (const u of users) userMap[u.user_uid] = u;

    const data = followers.map((f) => ({
      ...f,
      user: userMap[f.follower_uid] || null,
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

router.get('/:uid/following', authenticateUser, async (req: any, res: Response) => {
  try {
    const page = parseQueryParam(req.query.page, 1);
    const limit = parseQueryParam(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      UserFollow.find({ follower_uid: req.params.uid })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserFollow.countDocuments({ follower_uid: req.params.uid }),
    ]);

    const followedUIDs = following.map((f) => f.followed_uid);
    const users = await User.find({ user_uid: { $in: followedUIDs } }).select('user_uid piUsername avatar').lean();
    const userMap: Record<string, any> = {};
    for (const u of users) userMap[u.user_uid] = u;

    const data = following.map((f) => ({
      ...f,
      user: userMap[f.followed_uid] || null,
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

router.get('/:uid/posts', authenticateUser, async (req: any, res: Response) => {
  try {
    const page = parseQueryParam(req.query.page, 1);
    const limit = parseQueryParam(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({
        author_uid: req.params.uid,
        content_type: 'post',
        status: 'active',
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments({
        author_uid: req.params.uid,
        content_type: 'post',
        status: 'active',
      }),
    ]);

    const enriched = await enrichPostsWithAuthors(posts, req.user.user_uid);

    return res.json({
      success: true,
      data: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:uid/activity', authenticateUser, async (req: any, res: Response) => {
  try {
    const page = parseQueryParam(req.query.page, 1);
    const limit = parseQueryParam(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      UserActivity.find({ user_uid: req.params.uid })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserActivity.countDocuments({ user_uid: req.params.uid }),
    ]);

    return res.json({
      success: true,
      data: activities,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/search', authenticateUser, async (req: any, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q || q.length < 2) {
      return res.status(400).json({ success: false, error: 'Search query too short' });
    }

    const page = parseQueryParam(req.query.page, 1);
    const limit = parseQueryParam(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({ piUsername: { $regex: q, $options: 'i' } })
        .select('user_uid piUsername avatar bio')
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ piUsername: { $regex: q, $options: 'i' } }),
    ]);

    return res.json({
      success: true,
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
