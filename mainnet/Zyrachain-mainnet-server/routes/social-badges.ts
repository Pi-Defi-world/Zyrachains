import express, { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import { authenticateUser } from '../middleware/auth';
import Badge from '../zyrachain-lib/lib/models/Badge';
import UserBadge from '../zyrachain-lib/lib/models/UserBadge';
import { debitZP } from '../services/token-ledger';
import { seedDefaultBadges } from '../services/badge-evaluator';

const router: Router = express.Router();

router.get('/', authenticateUser, async (req: any, res: Response) => {
  try {
    await seedDefaultBadges();
    const badges = await Badge.find({ active: true }).sort({ tier: 1, category: 1 }).lean();
    return res.json({ success: true, data: badges });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:uid/earned', authenticateUser, async (req: any, res: Response) => {
  try {
    const userBadges = await UserBadge.find({ user_uid: req.params.uid })
      .populate('badge_id')
      .sort({ earned_at: -1 })
      .lean();

    const data = userBadges.map((b: any) => ({
      badge_key: b.badge_id?.badge_key || '',
      name: b.badge_id?.name || '',
      description: b.badge_id?.description || '',
      icon: b.badge_id?.icon || '',
      category: b.badge_id?.category || '',
      tier: b.badge_id?.tier || 1,
      earned_at: b.earned_at,
      expires_at: b.expires_at,
    }));

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:badgeId/purchase', authenticateUser, async (req: any, res: Response) => {
  try {
    const badge = await Badge.findById(req.params.badgeId);
    if (!badge) return res.status(404).json({ success: false, error: 'Badge not found' });
    if (badge.category !== 'paid' || !badge.price) {
      return res.status(400).json({ success: false, error: 'Badge is not purchasable' });
    }

    const existing = await UserBadge.findOne({
      user_uid: req.user.user_uid,
      badge_id: badge._id,
    });
    if (existing) return res.status(400).json({ success: false, error: 'Badge already owned' });

    await debitZP(req.user.user_uid, badge.price, 'badge_purchase', badge._id, 'Badge', {
      badge_name: badge.name,
    });

    const userBadge = new UserBadge({
      user_uid: req.user.user_uid,
      badge_id: badge._id,
      earned_at: new Date(),
    });
    await userBadge.save();

    const UserActivity = require('../zyrachain-lib/lib/models/UserActivity').default;
    await UserActivity.create({
      user_uid: req.user.user_uid,
      event_type: 'badge_earned',
      actor_uid: req.user.user_uid,
      reference_id: badge._id,
      reference_model: 'Badge',
      metadata: { badge_key: badge.badge_key, badge_name: badge.name, purchased: true },
    });

    return res.json({ success: true, data: { badge_key: badge.badge_key, name: badge.name, price: badge.price } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
