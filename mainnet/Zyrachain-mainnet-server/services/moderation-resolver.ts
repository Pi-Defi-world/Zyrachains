import ModerationVote from '../zyrachain-lib/lib/models/ModerationVote';
import Post from '../zyrachain-lib/lib/models/Post';
import { creditZP, debitZP, roundZP } from './token-ledger';

const REQUIRED_VOTES = 3;
const SUPERMAJORITY_RATE = 0.67;

export async function runModerationResolver(): Promise<void> {
  const flaggedPosts = await Post.find({
    content_type: 'post',
    status: 'flagged',
  }).lean();

  for (const post of flaggedPosts) {
    const votes = await ModerationVote.find({
      post_uid: post._id,
      resolved: false,
    });

    if (votes.length < REQUIRED_VOTES) continue;

    const flagCount = votes.filter((v) => v.vote === 'flag').length;
    const approveCount = votes.filter((v) => v.vote === 'approve').length;
    const totalRelevant = flagCount + approveCount;

    if (totalRelevant === 0) continue;

    const flagRatio = flagCount / totalRelevant;
    let outcome: 'moderated' | 'active';

    if (flagRatio >= SUPERMAJORITY_RATE) {
      outcome = 'moderated';
      await Post.findByIdAndUpdate(post._id, { status: 'moderated', is_boosted: false });
    } else {
      outcome = 'active';
      await Post.findByIdAndUpdate(post._id, { status: 'active' });
    }

    const correctVote = outcome === 'moderated' ? 'flag' : 'approve';

    for (const vote of votes) {
      const isCorrect = vote.vote === correctVote;
      const resolution = isCorrect ? 'win' : 'loss';

      if (isCorrect) {
        const reward = roundZP(vote.token_staked * 0.05);
        try {
          await creditZP(vote.moderator_uid, reward, 'moderation_reward', 'earned', vote._id as any, 'ModerationVote', {
            post_id: post._id,
            description: `Moderation reward for post resolution`,
          });
        } catch (err) {
          console.error(`[moderation] Reward error for ${vote.moderator_uid}:`, err);
        }
      } else {
        try {
          await debitZP(vote.moderator_uid, vote.token_staked, 'moderation_loss', vote._id as any, 'ModerationVote', {
            post_id: post._id,
          });
        } catch (err) {
          console.error(`[moderation] Loss debit error for ${vote.moderator_uid}:`, err);
        }
      }

      await ModerationVote.findByIdAndUpdate(vote._id, {
        resolved: true,
        resolution,
        resolved_at: new Date(),
      });
    }

    console.log(`[moderation-resolver] Resolved post ${post._id}: ${outcome} (${flagCount}F/${approveCount}A)`);
  }
}
