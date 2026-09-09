'use client';

import { useState, useEffect, useCallback } from 'react';

export type AdType = 'rewarded' | 'banner';

interface PiAdsState {
  isSupported: boolean;
  isPiBrowser: boolean;
  loading: boolean;
}

export function usePiAds() {
  const [state, setState] = useState<PiAdsState>({
    isSupported: false,
    isPiBrowser: false,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const isPi = typeof window !== 'undefined' && !!(window as any).Pi;
      if (!isPi) {
        if (mounted) setState({ isSupported: false, isPiBrowser: false, loading: false });
        return;
      }
      try {
        await (window as any).Pi.init({ version: '2.0' });
        const features = await (window as any).Pi.nativeFeaturesList?.();
        const supported = Array.isArray(features) && features.includes('ad_network');
        if (mounted) setState({ isSupported: supported, isPiBrowser: true, loading: false });
      } catch {
        if (mounted) setState({ isSupported: false, isPiBrowser: true, loading: false });
      }
    };
    check();
    return () => { mounted = false; };
  }, []);

  const showRewarded = useCallback(async (): Promise<{ adId: string; rewarded: boolean } | null> => {
    if (!state.isSupported) return null;
    try {
      const isReady = await (window as any).Pi.Ads?.isAdReady?.('rewarded');
      if (!isReady?.ready) {
        const reqResult = await (window as any).Pi.Ads?.requestAd?.('rewarded');
        if (reqResult?.result !== 'AD_LOADED') return null;
      }
      const result = await (window as any).Pi.Ads?.showAd?.('rewarded');
      if (result?.result === 'AD_REWARDED' && result.adId) {
        return { adId: result.adId, rewarded: true };
      }
      return null;
    } catch {
      return null;
    }
  }, [state.isSupported]);

  const verifyRewarded = useCallback(async (adId: string): Promise<boolean> => {
    const token = localStorage.getItem('pi_access_token');
    if (!token) return false;
    try {
      const res = await fetch('/api/social/ads/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adId }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.success && data.granted;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return { ...state, showRewarded, verifyRewarded };
}
