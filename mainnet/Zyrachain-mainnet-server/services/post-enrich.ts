import User from '../zyrachain-lib/lib/models/User';
import UserFollow from '../zyrachain-lib/lib/models/UserFollow';

export async function enrichPostsWithAuthors(
  posts: any[],
  viewerUID?: string
): Promise<any[]> {
  if (!posts || posts.length === 0) return posts;

  const authorUIDs = Array.from(new Set(posts.map((p) => p.author_uid).filter(Boolean)));
  if (authorUIDs.length === 0) return posts;

  const users = await User.find({ user_uid: { $in: authorUIDs } })
    .select('user_uid piUsername avatar bio')
    .lean();

  const userMap: Record<string, any> = {};
  for (const u of users) userMap[u.user_uid] = u;

  let followedSet = new Set<string>();
  if (viewerUID) {
    const follows = await UserFollow.find({ follower_uid: viewerUID }).select('followed_uid').lean();
    followedSet = new Set(follows.map((f) => String(f.followed_uid)));
  }

  return posts.map((post) => {
    const author = userMap[post.author_uid] || null;
    return {
      ...post,
      author_username: author?.piUsername || null,
      author_avatar: author?.avatar || null,
      author_bio: author?.bio || null,
      author_uid: post.author_uid,
      viewer_following: viewerUID ? followedSet.has(post.author_uid) : false,
    };
  });
}

export async function enrichPostWithAuthor(post: any, viewerUID?: string): Promise<any> {
  if (!post) return post;
  const [enriched] = await enrichPostsWithAuthors([post], viewerUID);
  return enriched;
}