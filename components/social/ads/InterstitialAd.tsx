'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Eye, CheckCircle2 } from 'lucide-react';
import { usePiAds } from './usePiAds';
import { useAdCooldown } from './AdCooldownContext';

export default function InterstitialAd() {
  const { isSupported, showInterstitial } = usePiAds();
  const { recordInterstitialShown } = useAdCooldown();
  const [shown, setShown] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const triggerAd = useCallback(async () => {
    if (shown || loading || !isSupported) return;
    setLoading(true);
    try {
      await showInterstitial();
      recordInterstitialShown();
      setShown(true);
    } catch {
      setShown(true);
    } finally {
      setLoading(false);
    }
  }, [shown, loading, isSupported, showInterstitial, recordInterstitialShown]);

  useEffect(() => {
    if (!ref.current || shown || !isSupported) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          triggerAd();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isSupported, shown, triggerAd]);

  if (!isSupported) return null;

  return (
    <div ref={ref} className="my-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Sponsored</p>
            <p className="text-[11px] text-blue-500 dark:text-blue-400">
              {shown ? 'Thanks for viewing!' : loading ? 'Loading ad...' : 'View ad for 2 ZP'}
            </p>
          </div>
        </div>
        {shown ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">+2 ZP</span>
        )}
      </div>
    </div>
  );
}
