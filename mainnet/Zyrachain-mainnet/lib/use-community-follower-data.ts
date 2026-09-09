'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface FollowerPoint {
  time: string;
  followers: number;
  following?: number;
  tweets?: number;
}

export interface CommunityGrowthStats {
  handle: string;
  name?: string;
  current: {
    followers: number;
    following: number;
    tweets: number;
    fetchedAt: string | null;
  };
  growth: {
    change1dAbs: number | null;
    change1dPct: number | null;
    change7dAbs: number | null;
    change7dPct: number | null;
    change30dAbs: number | null;
    change30dPct: number | null;
    totalGrowthPct: number | null;
    totalGrowthAbs: number | null;
  };
  allTimeHigh: number;
  snapshotCount: number;
}

export interface CommunityOverviewEntry {
  listingId: string;
  name: string;
  category: string;
  handle: string;
  followers: number | null;
  followingCount: number | null;
  tweetCount: number | null;
  profileImageUrl: string | null;
  verified: boolean | null;
  change24hAbs: number | null;
  change24hPct: number | null;
  change7dAbs: number | null;
  change7dPct: number | null;
  error: string | null;
  fetchedAt: string | null;
}

export interface CommunityOverview {
  total: number;
  totalFollowers: number;
  communities: CommunityOverviewEntry[];
}

export function useCommunityFollowerHistory(handle: string | null, range: '1d' | '7d' | '30d' | '90d' = '7d') {
  const { data, error, isLoading, mutate } = useSWR(
    handle ? `/api/community-followers/history?handle=${encodeURIComponent(handle)}&range=${range}` : null,
    fetcher,
    { refreshInterval: 300_000 }
  );

  return {
    history: (data?.data ?? []) as FollowerPoint[],
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

export function useCommunityFollowerStats(handle: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    handle ? `/api/community-followers/stats?handle=${encodeURIComponent(handle)}` : null,
    fetcher,
    { refreshInterval: 300_000 }
  );

  return {
    stats: (data ?? null) as CommunityGrowthStats | null,
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

export function useCommunityOverview() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/community-followers/overview',
    fetcher,
    { refreshInterval: 300_000 }
  );

  return {
    overview: (data ?? null) as CommunityOverview | null,
    loading: isLoading,
    error,
    refresh: mutate,
  };
}
