'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const INTERSTITIAL_INTERVAL = 5;
const REWARDED_COOLDOWN_MS = 3 * 60 * 1000;
const DAILY_REWARDED_LIMIT = 10;

interface AdCooldownState {
  postsSinceLastInterstitial: number;
  lastRewardedTime: number;
  dailyRewardedCount: number;
  lastRewardedDate: string;
}

interface AdCooldownContextValue {
  shouldShowInterstitial: (postIndex: number) => boolean;
  canShowRewarded: () => boolean;
  recordInterstitialShown: () => void;
  recordRewardedShown: () => void;
  getRewardedCooldownMs: () => number;
}

const AdCooldownContext = createContext<AdCooldownContextValue | null>(null);

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadState(): AdCooldownState {
  if (typeof window === 'undefined') {
    return { postsSinceLastInterstitial: 0, lastRewardedTime: 0, dailyRewardedCount: 0, lastRewardedDate: getTodayKey() };
  }
  try {
    const raw = localStorage.getItem('zyra_ad_cooldown');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.lastRewardedDate !== getTodayKey()) {
        parsed.dailyRewardedCount = 0;
        parsed.lastRewardedDate = getTodayKey();
      }
      return parsed;
    }
  } catch {}
  return { postsSinceLastInterstitial: 0, lastRewardedTime: 0, dailyRewardedCount: 0, lastRewardedDate: getTodayKey() };
}

function saveState(state: AdCooldownState) {
  try { localStorage.setItem('zyra_ad_cooldown', JSON.stringify(state)); } catch {}
}

export function AdCooldownProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdCooldownState>(loadState);

  useEffect(() => { saveState(state); }, [state]);

  const shouldShowInterstitial = useCallback((postIndex: number): boolean => {
    return (postIndex + 1) % INTERSTITIAL_INTERVAL === 0;
  }, []);

  const canShowRewarded = useCallback((): boolean => {
    const now = Date.now();
    if (state.dailyRewardedCount >= DAILY_REWARDED_LIMIT) return false;
    if (now - state.lastRewardedTime < REWARDED_COOLDOWN_MS) return false;
    return true;
  }, [state.dailyRewardedCount, state.lastRewardedTime]);

  const recordInterstitialShown = useCallback(() => {
    setState(prev => ({ ...prev, postsSinceLastInterstitial: 0 }));
  }, []);

  const recordRewardedShown = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastRewardedTime: Date.now(),
      dailyRewardedCount: prev.lastRewardedDate === getTodayKey() ? prev.dailyRewardedCount + 1 : 1,
      lastRewardedDate: getTodayKey(),
    }));
  }, []);

  const getRewardedCooldownMs = useCallback((): number => {
    const elapsed = Date.now() - state.lastRewardedTime;
    return Math.max(0, REWARDED_COOLDOWN_MS - elapsed);
  }, [state.lastRewardedTime]);

  return (
    <AdCooldownContext.Provider value={{ shouldShowInterstitial, canShowRewarded, recordInterstitialShown, recordRewardedShown, getRewardedCooldownMs }}>
      {children}
    </AdCooldownContext.Provider>
  );
}

export function useAdCooldown(): AdCooldownContextValue {
  const ctx = useContext(AdCooldownContext);
  if (!ctx) {
    return {
      shouldShowInterstitial: () => false,
      canShowRewarded: () => false,
      recordInterstitialShown: () => {},
      recordRewardedShown: () => {},
      getRewardedCooldownMs: () => 0,
    };
  }
  return ctx;
}
