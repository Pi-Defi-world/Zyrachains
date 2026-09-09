"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runModerationResolver = runModerationResolver;
const ModerationVote_1 = __importDefault(require("../zyrachain-lib/lib/models/ModerationVote"));
const Post_1 = __importDefault(require("../zyrachain-lib/lib/models/Post"));
const token_ledger_1 = require("./token-ledger");
const REQUIRED_VOTES = 3;
const SUPERMAJORITY_RATE = 0.67;
async function runModerationResolver() {
    const flaggedPosts = await Post_1.default.find({
        content_type: 'post',
        status: 'flagged',
    }).lean();
    for (const post of flaggedPosts) {
        const votes = await ModerationVote_1.default.find({
            post_uid: post._id,
            resolved: false,
        });
        if (votes.length < REQUIRED_VOTES)
            continue;
        const flagCount = votes.filter((v) => v.vote === 'flag').length;
        const approveCount = votes.filter((v) => v.vote === 'approve').length;
        const totalRelevant = flagCount + approveCount;
        if (totalRelevant === 0)
            continue;
        const flagRatio = flagCount / totalRelevant;
        let outcome;
        if (flagRatio >= SUPERMAJORITY_RATE) {
            outcome = 'moderated';
            await Post_1.default.findByIdAndUpdate(post._id, { status: 'moderated', is_boosted: false });
        }
        else {
            outcome = 'active';
            await Post_1.default.findByIdAndUpdate(post._id, { status: 'active' });
        }
        const correctVote = outcome === 'moderated' ? 'flag' : 'approve';
        for (const vote of votes) {
            const isCorrect = vote.vote === correctVote;
            const resolution = isCorrect ? 'win' : 'loss';
            if (isCorrect) {
                const reward = (0, token_ledger_1.roundZP)(vote.token_staked * 0.05);
                try {
                    await (0, token_ledger_1.creditZP)(vote.moderator_uid, reward, 'moderation_reward', 'earned', vote._id, 'ModerationVote', {
                        post_id: post._id,
                        description: `Moderation reward for post resolution`,
                    });
                }
                catch (err) {
                    console.error(`[moderation] Reward error for ${vote.moderator_uid}:`, err);
                }
            }
            else {
                try {
                    await (0, token_ledger_1.debitZP)(vote.moderator_uid, vote.token_staked, 'moderation_loss', vote._id, 'ModerationVote', {
                        post_id: post._id,
                    });
                }
                catch (err) {
                    console.error(`[moderation] Loss debit error for ${vote.moderator_uid}:`, err);
                }
            }
            await ModerationVote_1.default.findByIdAndUpdate(vote._id, {
                resolved: true,
                resolution,
                resolved_at: new Date(),
            });
        }
        console.log(`[moderation-resolver] Resolved post ${post._id}: ${outcome} (${flagCount}F/${approveCount}A)`);
    }
}
//# sourceMappingURL=moderation-resolver.js.map