'use client';

export interface PiStakeData {
  effective_stake: number;
  raw_stake: number;
  boost_multiplier: number;
}

export async function getUserStake(accessToken: string): Promise<PiStakeData | null> {
  const token = accessToken || localStorage.getItem('pi_access_token');
  if (!token) return null;
  try {
    const res = await fetch('/api/pi/staking', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

export function formatStake(stake: number): string {
  if (stake >= 1000000) return `${(stake / 1000000).toFixed(1)}M`;
  if (stake >= 1000) return `${(stake / 1000).toFixed(1)}K`;
  return stake.toFixed(2);
}

export function getStakeTier(effectiveStake: number): { tier: string; color: string; icon: string } {
  if (effectiveStake >= 100000) return { tier: 'Diamond', color: 'text-cyan-500', icon: '💎' };
  if (effectiveStake >= 50000) return { tier: 'Gold', color: 'text-yellow-500', icon: '🏆' };
  if (effectiveStake >= 10000) return { tier: 'Silver', color: 'text-gray-400', icon: '🥈' };
  if (effectiveStake >= 1000) return { tier: 'Bronze', color: 'text-orange-400', icon: '🥉' };
  return { tier: 'Basic', color: 'text-muted-foreground', icon: '' };
}
