'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePiNetwork } from './PiNetworkContext';
import { socialAPI } from '@/lib/social-api-client';

interface SocialUser {
  uid: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  follower_count: number;
  following_count: number;
  post_count: number;
  balance: number;
  xp: number;
  level: number;
  streak_days: number;
  badges: any[];
  is_following: boolean;
}

interface TokenBalance {
  balance: number;
  earned_balance: number;
  purchased_balance: number;
  ad_balance: number;
  total_spent: number;
  total_earned: number;
}

interface GameStats {
  xp: number;
  level: number;
  progress_percent: number;
  streak_days: number;
  weekly_xp: number;
  total_missions_completed: number;
}

interface SocialContextType {
  tokenBalance: TokenBalance | null;
  gameStats: GameStats | null;
  feed: any[];
  feedType: string;
  feedLoading: boolean;
  hasMore: boolean;

  refreshBalance: () => Promise<void>;
  refreshGameStats: () => Promise<void>;
  loadFeed: (type?: string, page?: number, limit?: number) => Promise<void>;
  loadMoreFeed: () => Promise<void>;
  setFeedType: (type: string) => void;

  createPost: (content: string, images?: string[], tags?: string[], visibility?: string) => Promise<any>;
  likePost: (postId: string) => Promise<any>;
  tipPost: (postId: string, amount: number) => Promise<any>;
  resharePost: (postId: string) => Promise<any>;
  boostPost: (postId: string, amount: number) => Promise<any>;
  getProfile: (uid: string) => Promise<SocialUser>;
  followUser: (uid: string) => Promise<any>;
  unfollowUser: (uid: string) => Promise<any>;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = usePiNetwork();

  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [feedType, setFeedType] = useState('trending');
  const [feedPage, setFeedPage] = useState(1);
  const [feedTotal, setFeedTotal] = useState(0);
  const [feedLoading, setFeedLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const refreshBalance = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await socialAPI.getBalance();
      setTokenBalance(data.data);
    } catch (err) {
      console.error('Error loading balance:', err);
    }
  }, [isAuthenticated]);

  const refreshGameStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await socialAPI.getGameStats();
      setGameStats(data.data);
    } catch (err) {
      console.error('Error loading game stats:', err);
    }
  }, [isAuthenticated]);

  const loadFeed = useCallback(async (type?: string, page = 1, limit = 20) => {
    if (!isAuthenticated) return;
    setFeedLoading(true);
    const t = type || feedType;
    try {
      const data = await socialAPI.getFeed(t, page, limit);
      const posts = data.data || [];
      const total = data.pagination?.total || 0;
      if (page === 1) {
        setFeed(posts);
      } else {
        setFeed((prev) => [...prev, ...posts]);
      }
      setFeedTotal(total);
      setFeedPage(page);
      setHasMore(page * limit < total);
    } catch (err) {
      console.error('Error loading feed:', err);
    } finally {
      setFeedLoading(false);
    }
  }, [isAuthenticated, feedType]);

  const loadMoreFeed = useCallback(async () => {
    if (feedLoading || !hasMore) return;
    await loadFeed(feedType, feedPage + 1);
  }, [feedLoading, hasMore, feedType, feedPage, loadFeed]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshBalance();
      refreshGameStats();
      loadFeed(feedType, 1);
    }
  }, [isAuthenticated, feedType, refreshBalance, refreshGameStats, loadFeed]);

  const createPost = async (content: string, images?: string[], tags?: string[], visibility?: string) => {
    const data = await socialAPI.createPost(content, images, tags, visibility);
    await refreshBalance();
    await refreshGameStats();
    await loadFeed(feedType, 1);
    return data;
  };

  const likePost = async (postId: string) => {
    const data = await socialAPI.likePost(postId);
    await refreshBalance();
    setFeed((prev) =>
      prev.map((p) =>
        p._id === postId ? { ...p, like_count: (p.like_count || 0) + 1 } : p
      )
    );
    return data;
  };

  const tipPost = async (postId: string, amount: number) => {
    const data = await socialAPI.tipPost(postId, amount);
    await refreshBalance();
    setFeed((prev) =>
      prev.map((p) =>
        p._id === postId
          ? { ...p, tips_received: data.tips_received || (p.tips_received || 0) + amount }
          : p
      )
    );
    return data;
  };

  const resharePost = async (postId: string) => {
    const data = await socialAPI.resharePost(postId);
    await refreshBalance();
    setFeed((prev) =>
      prev.map((p) =>
        p._id === postId ? { ...p, reshare_count: (p.reshare_count || 0) + 1 } : p
      )
    );
    return data;
  };

  const boostPost = async (postId: string, amount: number) => {
    const data = await socialAPI.boostPost(postId, amount);
    await refreshBalance();
    return data;
  };

  const getProfile = async (uid: string): Promise<SocialUser> => {
    const data = await socialAPI.getProfile(uid);
    return data.data;
  };

  const followUser = async (uid: string) => {
    const data = await socialAPI.followUser(uid);
    await refreshGameStats();
    return data;
  };

  const unfollowUser = async (uid: string) => {
    const data = await socialAPI.unfollowUser(uid);
    return data;
  };

  const value: SocialContextType = {
    tokenBalance,
    gameStats,
    feed,
    feedType,
    feedLoading,
    hasMore,
    refreshBalance,
    refreshGameStats,
    loadFeed,
    loadMoreFeed,
    setFeedType,
    createPost,
    likePost,
    tipPost,
    resharePost,
    boostPost,
    getProfile,
    followUser,
    unfollowUser,
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (context === undefined) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
}
