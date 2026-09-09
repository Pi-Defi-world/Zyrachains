// All social calls are proxied through the same-origin Next.js route handler
// (app/api/social/[...path]/route.ts), which forwards to the Express backend.
// This avoids CORS and build-time-URL issues in production — the browser only
// talks to this host. The Pi access token is attached so the backend's
// authenticateUser middleware can resolve the user.
const BASE = '';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('pi_access_token') : null;
  const url = `${BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}

export const socialAPI = {
  // Tokens
  getBalance: () => fetchAPI('/api/social/tokens/balance'),
  getTransactions: (page = 1, limit = 20) =>
    fetchAPI(`/api/social/tokens/transactions?page=${page}&limit=${limit}`),
  purchaseComplete: (paymentId: string, txid: string, piAmount: number) =>
    fetchAPI('/api/social/tokens/purchase/complete', {
      method: 'POST',
      body: JSON.stringify({ paymentId, txid, piAmount }),
    }),

  // Posts
  getFeed: (type = 'new', page = 1, limit = 20) =>
    fetchAPI(`/api/social/posts?type=${type}&page=${page}&limit=${limit}`),
  createPost: (content: string, images?: string[], tags?: string[], visibility?: string) =>
    fetchAPI('/api/social/posts', {
      method: 'POST',
      body: JSON.stringify({ content, images, tags, visibility }),
    }),
  getPost: (id: string) => fetchAPI(`/api/social/posts/${id}`),
  deletePost: (id: string) => fetchAPI(`/api/social/posts/${id}`, { method: 'DELETE' }),
  likePost: (id: string) => fetchAPI(`/api/social/posts/${id}/like`, { method: 'POST' }),
  dislikePost: (id: string) => fetchAPI(`/api/social/posts/${id}/dislike`, { method: 'POST' }),
  tipPost: (id: string, amount: number) =>
    fetchAPI(`/api/social/posts/${id}/tip`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  resharePost: (id: string) => fetchAPI(`/api/social/posts/${id}/reshare`, { method: 'POST' }),
  boostPost: (id: string, amount: number) =>
    fetchAPI(`/api/social/posts/${id}/boost`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  reportPost: (id: string) => fetchAPI(`/api/social/posts/${id}/report`, { method: 'POST' }),
  getComments: (id: string, page = 1, limit = 20) =>
    fetchAPI(`/api/social/posts/${id}/comments?page=${page}&limit=${limit}`),
  addComment: (id: string, content: string) =>
    fetchAPI(`/api/social/posts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  searchPosts: (q: string, page = 1, limit = 20) =>
    fetchAPI(`/api/social/posts/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`),

  // Users
  getProfile: (uid: string) => fetchAPI(`/api/social/users/${uid}/profile`),
  updateProfile: (data: { avatar?: string | null; bio?: string | null }) =>
    fetchAPI('/api/social/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getUserPosts: (uid: string, page = 1, limit = 20) =>
    fetchAPI(`/api/social/users/${uid}/posts?page=${page}&limit=${limit}`),
  followUser: (uid: string) => fetchAPI(`/api/social/users/${uid}/follow`, { method: 'POST' }),
  unfollowUser: (uid: string) => fetchAPI(`/api/social/users/${uid}/follow`, { method: 'DELETE' }),
  getFollowers: (uid: string, page = 1, limit = 20) =>
    fetchAPI(`/api/social/users/${uid}/followers?page=${page}&limit=${limit}`),
  getFollowing: (uid: string, page = 1, limit = 20) =>
    fetchAPI(`/api/social/users/${uid}/following?page=${page}&limit=${limit}`),
  getActivity: (uid: string, page = 1, limit = 20) =>
    fetchAPI(`/api/social/users/${uid}/activity?page=${page}&limit=${limit}`),
  searchUsers: (q: string, page = 1, limit = 20) =>
    fetchAPI(`/api/social/users/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`),

  // Badges
  getBadges: () => fetchAPI('/api/social/badges'),
  getUserBadges: (uid: string) => fetchAPI(`/api/social/badges/${uid}/earned`),
  purchaseBadge: (badgeId: string) =>
    fetchAPI(`/api/social/badges/${badgeId}/purchase`, { method: 'POST' }),

  // Moderation
  getModerationQueue: (page = 1, limit = 20) =>
    fetchAPI(`/api/social/moderation/queue?page=${page}&limit=${limit}`),
  stakeModerator: () => fetchAPI('/api/social/moderation/stake', { method: 'POST' }),
  castModerationVote: (post_id: string, vote: string, reason?: string) =>
    fetchAPI('/api/social/moderation/vote', {
      method: 'POST',
      body: JSON.stringify({ post_id, vote, reason }),
    }),
  getModerationStats: () => fetchAPI('/api/social/moderation/stats'),

  // Ads
  getAds: () => fetchAPI('/api/social/ads'),
  watchAd: (adId: string) => fetchAPI(`/api/social/ads/${adId}/watch`, { method: 'POST' }),
  getAdRewardStatus: () => fetchAPI('/api/social/ads/reward-status'),

  // Gamification
  getGameStats: () => fetchAPI('/api/social/gamification/stats'),
  getMissions: () => fetchAPI('/api/social/gamification/missions'),
  claimMission: (key: string) =>
    fetchAPI(`/api/social/gamification/missions/${key}/claim`, { method: 'POST' }),
  getLeaderboard: (page = 1, limit = 100) =>
    fetchAPI(`/api/social/gamification/leaderboard?page=${page}&limit=${limit}`),
  getStreak: () => fetchAPI('/api/social/gamification/streak'),

  // Referrals
  applyReferral: (code: string) =>
    fetchAPI('/api/social/referrals/apply', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  getReferralStats: () => fetchAPI('/api/social/referrals/stats'),
};
