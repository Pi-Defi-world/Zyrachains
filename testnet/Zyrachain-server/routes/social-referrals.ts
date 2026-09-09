import express, { Request, Response, Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import User from '../zyrachain-lib/lib/models/User';
import Referral from '../zyrachain-lib/lib/models/Referral';
import { creditZP } from '../services/token-ledger';
import { getReferralReward } from '../services/platform-settings';
import mongoose from 'mongoose';

const router: Router = express.Router();

function normalizeUsername(raw: string): string {
  return String(raw || '').trim().replace(/^@/, '').toLowerCase();
}

/**
 * POST /api/social/referrals/apply
 * Body: { code }  (the referrer's piUsername)
 * Sets the current user's referrer (one time) and rewards the referrer.
 */
router.post('/apply', authenticateUser, async (req: any, res: Response) => {
  try {
    const code = normalizeUsername(req.body?.code);
    if (!code) {
      return res.status(400).json({ success: false, error: 'Referral code (username) is required' });
    }

    const current = await User.findOne({ user_uid: req.user.user_uid });
    if (!current) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const ownUsername = normalizeUsername(current.piUsername || '');
    if (ownUsername && ownUsername === code) {
      return res.status(400).json({ success: false, error: 'You cannot refer yourself' });
    }

    if (current.referred_by) {
      return res.status(400).json({ success: false, error: 'Referral code already applied' });
    }

    const alreadyReferral = await Referral.findOne({ referred_uid: req.user.user_uid });
    if (alreadyReferral) {
      return res.status(400).json({ success: false, error: 'Referral already processed' });
    }

    const referrer = await User.findOne({ piUsername: code });
    if (!referrer) {
      return res.status(404).json({ success: false, error: 'Referral code not found' });
    }
    if (referrer.user_uid === req.user.user_uid) {
      return res.status(400).json({ success: false, error: 'You cannot refer yourself' });
    }

    current.referred_by = referrer.piUsername;
    current.referred_at = new Date();
    await current.save();

    const reward = await getReferralReward();

    let credited = false;
    if (reward > 0) {
      const referral = new Referral({
        referrer_uid: referrer.user_uid,
        referrer_username: referrer.piUsername || referrer.user_uid,
        referred_uid: req.user.user_uid,
        referred_username: current.piUsername || req.user.user_uid,
        reward_zp: reward,
        status: 'rewarded',
      });
      await referral.save();

      await creditZP(referrer.user_uid, reward, 'referral_reward', 'earned', referral._id, 'Referral', {
        description: `Referral reward for ${current.piUsername || req.user.user_uid}`,
      });
      credited = true;
    }

    return res.json({
      success: true,
      referred_by: referrer.piUsername,
      reward_credited: credited,
      message: credited ? 'Referral applied and reward credited' : 'Referral applied',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/social/referrals/stats
 * Returns the current user's referral code (username), count and total earned.
 */
router.get('/stats', authenticateUser, async (req: any, res: Response) => {
  try {
    const user: any = await User.findOne({ user_uid: req.user.user_uid }).lean();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const [referrals, earnedRows] = await Promise.all([
      Referral.find({ referrer_uid: req.user.user_uid }).sort({ createdAt: -1 }).lean(),
      mongoose.connection
        .collection('tokentransactions')
        .find({ to_user_uid: req.user.user_uid, tx_type: 'referral_reward' })
        .toArray(),
    ]);

    const totalEarned = earnedRows.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

    return res.json({
      success: true,
      data: {
        code: user.piUsername || '',
        referral_count: referrals.length,
        total_earned: Math.round(totalEarned * 10000) / 10000,
        referrals: referrals.map((r) => ({
          referred_username: r.referred_username,
          reward_zp: r.reward_zp,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
