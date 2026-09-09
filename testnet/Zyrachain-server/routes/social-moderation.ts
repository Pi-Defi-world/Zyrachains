import express, { Request, Response, Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import Post from '../zyrachain-lib/lib/models/Post';
import ModerationVote from '../zyrachain-lib/lib/models/ModerationVote';
import Badge from '../zyrachain-lib/lib/models/Badge';
import UserBadge from '../zyrachain-lib/lib/models/UserBadge';
import { debitZP } from '../services/token-ledger';
import { addXP } from '../services/gamification-service';
import { enrichPostsWithAuthors } from '../services/post-enrich';

const router: Router = express.Router();

const MODERATOR_STAKE = 50;
const VOTE_STAKE = 5;

function parseQueryParam(val: any, fallback: number): number {
  const n = parseInt(val as string);
  return isNaN(n) || n < 1 ? fallback : n;
}

router.get('/queue', authenticateUser, async (req: any, res: Response) => {
  try {
    const page = parseQueryParam(req.query.page, 1);
    const limit = parseQueryParam(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const query = { content_type: 'post', status: 'flagged' };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(query),
    ]);

    for (const post of posts) {
      const voteCount = await ModerationVote.countDocuments({ post_uid: post._id });
      (post as any).vote_count = voteCount;
    }

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

router.post('/stake', authenticateUser, async (req: any, res: Response) => {
  try {
    const moderatorBadge = await Badge.findOne({ badge_key: 'moderator' });
    if (!moderatorBadge) return res.status(404).json({ success: false, error: 'Moderator badge not found' });

    const existing = await UserBadge.findOne({
      user_uid: req.user.user_uid,
      badge_id: moderatorBadge._id,
    });
    if (existing) return res.status(400).json({ success: false, error: 'Already a moderator' });

    await debitZP(req.user.user_uid, MODERATOR_STAKE, 'moderation_loss', null, '', {
      description: 'Moderator staking',
    });

    const userBadge = new UserBadge({
      user_uid: req.user.user_uid,
      badge_id: moderatorBadge._id,
      earned_at: new Date(),
      metadata: { staked: MODERATOR_STAKE },
    });
    await userBadge.save();

    return res.json({ success: true, message: `Staked ${MODERATOR_STAKE} ZP. You are now a moderator.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/vote', authenticateUser, async (req: any, res: Response) => {
  try {
    const { post_id, vote, reason } = req.body;
    if (!post_id || !['flag', 'approve', 'abstain'].includes(vote)) {
      return res.status(400).json({ success: false, error: 'post_id and valid vote (flag/approve/abstain) required' });
    }

    const moderatorBadge = await Badge.findOne({ badge_key: 'moderator' });
    if (!moderatorBadge) return res.status(404).json({ success: false, error: 'Moderator badge not found' });

    const isModerator = await UserBadge.findOne({
      user_uid: req.user.user_uid,
      badge_id: moderatorBadge._id,
    });
    if (!isModerator) return res.status(403).json({ success: false, error: 'Must be a moderator to vote' });

    const post = await Post.findById(post_id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    if (post.status !== 'flagged') {
      return res.status(400).json({ success: false, error: 'Post is not flagged' });
    }

    const existingVote = await ModerationVote.findOne({
      post_uid: post._id,
      moderator_uid: req.user.user_uid,
    });
    if (existingVote) return res.status(400).json({ success: false, error: 'Already voted on this post' });

    const voteStake = vote === 'abstain' ? 1 : VOTE_STAKE;
    await debitZP(req.user.user_uid, voteStake, 'moderation_loss', post._id, 'Post', {
      description: `Moderation vote stake: ${vote}`,
    });

    const modVote = new ModerationVote({
      post_uid: post._id,
      moderator_uid: req.user.user_uid,
      vote,
      token_staked: voteStake,
      reason: reason || '',
    });
    await modVote.save();

    await addXP(req.user.user_uid, 2, 'moderation_vote');

    return res.json({ success: true, vote_id: modVote._id });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/stats', authenticateUser, async (req: any, res: Response) => {
  try {
    const [totalVotes, correctVotes, totalStaked] = await Promise.all([
      ModerationVote.countDocuments({ moderator_uid: req.user.user_uid }),
      ModerationVote.countDocuments({ moderator_uid: req.user.user_uid, resolution: 'win' }),
      ModerationVote.aggregate([
        { $match: { moderator_uid: req.user.user_uid } },
        { $group: { _id: null, total: { $sum: '$token_staked' } } },
      ]),
    ]);

    const isModerator = !!(await Badge.findOne({ badge_key: 'moderator' }).then(async (badge) => {
      if (!badge) return false;
      return UserBadge.findOne({ user_uid: req.user.user_uid, badge_id: badge._id });
    }));

    return res.json({
      success: true,
      data: {
        is_moderator: !!isModerator,
        total_votes: totalVotes,
        correct_votes: correctVotes,
        accuracy: totalVotes > 0 ? Math.round((correctVotes / totalVotes) * 100) : 0,
        total_staked: totalStaked[0]?.total || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
