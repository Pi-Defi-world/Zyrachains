import Post from '../zyrachain-lib/lib/models/Post';

export function computeTrendingScore(post: any): number {
  const now = Date.now();
  const ageMs = now - new Date(post.createdAt).getTime();
  const ageHours = Math.max(ageMs / (1000 * 60 * 60), 0.1);

  const engagement =
    (post.tips_received || 0) * 5 +
    (post.like_count || 0) * 2 +
    (post.comment_count || 0) * 1.5 +
    (post.reshare_count || 0) * 3 +
    (post.impression_count || 0) * 0.01;

  const boostScore = post.is_boosted ? Math.min(post.boost_amount || 0, 1000) / 10 : 0;

  return (engagement + boostScore) / Math.pow(ageHours + 2, 1.5);
}

export async function runTrendingScorer(): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const posts = await Post.find({
    content_type: 'post',
    status: 'active',
    createdAt: { $gte: sevenDaysAgo },
  }).lean();

  const bulkOps = posts
    .map((post) => {
      const score = computeTrendingScore(post);
      // Only write posts whose score actually changed to avoid rewrite bursts
      if (Math.abs((post.trending_score || 0) - score) < 1e-9) return null;
      return {
        updateOne: {
          filter: { _id: post._id },
          update: { $set: { trending_score: score } },
        },
      };
    })
    .filter(Boolean);

  if (bulkOps.length > 0) {
    await Post.bulkWrite(bulkOps as any);
  }

  console.log(`[trending-scorer] Scored ${posts.length} posts (${bulkOps.length} updated)`);
}

export async function getTrendingFeed(
  page: number = 1,
  limit: number = 20
): Promise<{ posts: any[]; total: number }> {
  const skip = (page - 1) * limit;
  const query = { content_type: 'post', status: 'active' };

  const [posts, total] = await Promise.all([
    Post.find(query)
      .sort({ trending_score: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Post.countDocuments(query),
  ]);

  return { posts, total };
}

export async function getFollowingFeed(
  userUID: string,
  followedUIDs: string[],
  page: number = 1,
  limit: number = 20
): Promise<{ posts: any[]; total: number }> {
  const skip = (page - 1) * limit;
  const authorUIDs = [...followedUIDs, userUID];
  const query = {
    content_type: 'post',
    status: 'active',
    author_uid: { $in: authorUIDs },
  };

  const [posts, total] = await Promise.all([
    Post.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Post.countDocuments(query),
  ]);

  return { posts, total };
}

export async function getNewFeed(
  page: number = 1,
  limit: number = 20
): Promise<{ posts: any[]; total: number }> {
  const skip = (page - 1) * limit;
  const query = { content_type: 'post', status: 'active' };

  const [posts, total] = await Promise.all([
    Post.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Post.countDocuments(query),
  ]);

  return { posts, total };
}
