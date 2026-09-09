import Badge from '../zyrachain-lib/lib/models/Badge';
import UserBadge from '../zyrachain-lib/lib/models/UserBadge';
import UserFollow from '../zyrachain-lib/lib/models/UserFollow';
import Post from '../zyrachain-lib/lib/models/Post';
import UserAction from '../zyrachain-lib/lib/models/UserAction';
import UserActivity from '../zyrachain-lib/lib/models/UserActivity';
import ModerationVote from '../zyrachain-lib/lib/models/ModerationVote';

export async function evaluateAndAwardBadges(userUID: string): Promise<any[]> {
  const allBadges = await Badge.find({ active: true }).lean();
  const userBadges = await UserBadge.find({ user_uid: userUID }).lean();
  const earnedKeys = new Set(userBadges.map((b) => b.badge_id.toString()));

  const followerCount = await UserFollow.countDocuments({ followed_uid: userUID });
  const postCount = await Post.countDocuments({ author_uid: userUID, content_type: 'post', status: { $ne: 'removed' } });
  const likeCount = await UserAction.countDocuments({ user_uid: userUID, action_type: 'like' });
  const moderationCount = await ModerationVote.countDocuments({ moderator_uid: userUID });

  const context: Record<string, any> = {
    followers: followerCount,
    posts: postCount,
    likes: likeCount,
    moderations: moderationCount,
  };

  const newBadges: any[] = [];

  for (const badge of allBadges) {
    if (earnedKeys.has((badge._id as any).toString())) continue;
    if (badge.category === 'paid') continue;

    const criteria = badge.criteria as Record<string, number>;
    let meets = true;

    for (const [key, target] of Object.entries(criteria)) {
      if ((context[key] || 0) < target) {
        meets = false;
        break;
      }
    }

    if (meets) {
      const userBadge = new UserBadge({
        user_uid: userUID,
        badge_id: badge._id,
        earned_at: new Date(),
      });
      await userBadge.save();
      newBadges.push(badge);

      await UserActivity.create({
        user_uid: userUID,
        event_type: 'badge_earned',
        actor_uid: userUID,
        reference_id: badge._id,
        reference_model: 'Badge',
        metadata: { badge_key: badge.badge_key, badge_name: badge.name },
      });
    }
  }

  return newBadges;
}

export async function checkTriggerBadges(userUID: string, actionType: string): Promise<void> {
  try {
    await evaluateAndAwardBadges(userUID);
  } catch (err) {
    console.error('[badge-evaluator] Error evaluating badges:', err);
  }
}

export async function seedDefaultBadges(): Promise<void> {
  const existing = await Badge.countDocuments();
  if (existing > 0) return;

  const badges = [
    { badge_key: 'newcomer', name: 'Newcomer', description: 'Welcome to Zyra Social', icon: '👋', category: 'special', criteria: {}, tier: 1 },
    { badge_key: 'rising_star', name: 'Rising Star', description: 'Reached 10 followers', icon: '⭐', category: 'follower_based', criteria: { followers: 10 }, tier: 1 },
    { badge_key: 'popular', name: 'Popular', description: 'Reached 100 followers', icon: '🌟', category: 'follower_based', criteria: { followers: 100 }, tier: 2 },
    { badge_key: 'influencer', name: 'Influencer', description: 'Reached 1,000 followers', icon: '💫', category: 'follower_based', criteria: { followers: 1000 }, tier: 3 },
    { badge_key: 'mega_star', name: 'Mega Star', description: 'Reached 10,000 followers', icon: '👑', category: 'follower_based', criteria: { followers: 10000 }, tier: 4 },
    { badge_key: 'content_creator', name: 'Content Creator', description: 'Published 10 posts', icon: '✍️', category: 'achievement', criteria: { posts: 10 }, tier: 1 },
    { badge_key: 'prolific_creator', name: 'Prolific Creator', description: 'Published 50 posts', icon: '📝', category: 'achievement', criteria: { posts: 50 }, tier: 2 },
    { badge_key: 'curator', name: 'Curator', description: 'Liked 100 posts', icon: '👍', category: 'achievement', criteria: { likes: 100 }, tier: 2 },
    { badge_key: 'moderator', name: 'Moderator', description: 'Community moderator', icon: '🛡️', category: 'moderator', criteria: { moderations: 1 }, tier: 3 },
    { badge_key: 'premium', name: 'Premium', description: 'Premium member badge', icon: '💎', category: 'paid', criteria: {}, price: 50, tier: 2 },
    { badge_key: 'vip', name: 'VIP', description: 'VIP member badge', icon: '🏆', category: 'paid', criteria: {}, price: 200, tier: 3 },
    { badge_key: 'og', name: 'OG', description: 'Early adopter', icon: '🔥', category: 'paid', criteria: {}, price: 100, tier: 2 },
  ];

  await Badge.insertMany(badges);
  console.log(`[badge-evaluator] Seeded ${badges.length} default badges`);
}
