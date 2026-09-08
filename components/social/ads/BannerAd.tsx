'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePiAds } from './usePiAds';

export default function BannerAd() {
  const { isSupported, showInterstitial } = usePiAds();
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isSupported || dismissed) return;
    const timer = setTimeout(() => setLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, [isSupported, dismissed]);

  useEffect(() => {
    if (!loaded || dismissed) return;
    showInterstitial();
  }, [loaded, dismissed, showInterstitial]);

  if (!isSupported || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg">
      <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
            <span className="text-[8px] font-bold text-white">AD</span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate">Loading banner ad...</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-full hover:bg-muted transition-colors shrink-0"
          aria-label="Close ad"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
