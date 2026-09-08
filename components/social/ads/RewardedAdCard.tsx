'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Gift, Loader2, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { usePiAds } from './usePiAds';
import { useAdCooldown } from './AdCooldownContext';
import { useToast } from '@/components/context/ToastContext';

interface RewardedAdCardProps {
  variant?: 'feed' | 'comment';
}

export default function RewardedAdCard({ variant = 'feed' }: RewardedAdCardProps) {
  const { isSupported, showRewarded, verifyRewarded } = usePiAds();
  const { canShowRewarded, recordRewardedShown, getRewardedCooldownMs } = useAdCooldown();
  const { showToast } = useToast();
  const [status, setStatus] = useState<'idle' | 'loading' | 'verifying' | 'done' | 'cooldown'>('idle');
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    const ms = getRewardedCooldownMs();
    setCooldownRemaining(ms);
    if (ms <= 0) return;
    const interval = setInterval(() => {
      const remaining = getRewardedCooldownMs();
      setCooldownRemaining(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [getRewardedCooldownMs, status]);

  const handleWatch = useCallback(async () => {
    if (status !== 'idle' || !canShowRewarded()) return;
    setStatus('loading');
    try {
      const result = await showRewarded();
      if (!result?.rewarded) {
        setStatus('idle');
        return;
      }
      setStatus('verifying');
      const granted = await verifyRewarded(result.adId);
      if (granted) {
        recordRewardedShown();
        setStatus('done');
        showToast('+5 ZP earned!', 'success');
      } else {
        setStatus('idle');
        showToast('Ad verification failed', 'error');
      }
    } catch {
      setStatus('idle');
      showToast('Ad failed to load', 'error');
    }
  }, [status, canShowRewarded, showRewarded, verifyRewarded, recordRewardedShown, showToast]);

  if (!isSupported) return null;

  const cooldownMinutes = Math.ceil(cooldownRemaining / 60000);
  const isCooldown = !canShowRewarded() && status === 'idle';

  if (variant === 'comment') {
    return (
      <div className="my-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
              {status === 'done' ? 'Reward claimed!' : isCooldown ? `Available in ${cooldownMinutes}m` : 'Watch ad for 5 ZP'}
            </span>
          </div>
          {status === 'idle' && !isCooldown && (
            <button onClick={handleWatch} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
              +5 ZP →
            </button>
          )}
          {status === 'loading' && <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />}
          {status === 'verifying' && <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />}
          {status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
          {isCooldown && <Clock className="w-4 h-4 text-purple-400" />}
        </div>
      </div>
    );
  }

  return (
    <div className="my-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
          {status === 'done' ? (
            <CheckCircle2 className="w-5 h-5 text-white" />
          ) : (
            <Sparkles className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Pi Rewarded Ad</span>
            <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">+5 ZP</span>
          </div>
          <p className="text-[11px] text-purple-500 dark:text-purple-400 mt-0.5">
            {status === 'done'
              ? 'Reward credited to your account!'
              : status === 'loading'
              ? 'Loading ad...'
              : status === 'verifying'
              ? 'Verifying reward...'
              : isCooldown
              ? `Available in ${cooldownMinutes} minute${cooldownMinutes !== 1 ? 's' : ''}`
              : 'Watch a short ad to earn 5 ZP'}
          </p>
        </div>
        {status === 'idle' && !isCooldown && (
          <button
            onClick={handleWatch}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-xs font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <Gift className="w-3.5 h-3.5" /> Watch
          </button>
        )}
        {(status === 'loading' || status === 'verifying') && (
          <Loader2 className="w-5 h-5 text-purple-500 animate-spin shrink-0" />
        )}
        {isCooldown && status === 'idle' && (
          <Clock className="w-5 h-5 text-purple-400 shrink-0" />
        )}
      </div>
    </div>
  );
}
