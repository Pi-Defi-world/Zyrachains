'use client';

import React, { useState, useEffect } from 'react';
import { X, Play } from 'lucide-react';
import { useLanguage } from '@/context/languagecontext';

interface AdPlayerProps {
  ad: {
    _id: string;
    title: string;
    content: string;
    media_url: string;
    target_url: string;
    reward_per_view: number;
    call_to_action?: string;
  };
  onComplete: () => void;
  onClose: () => void;
}

const WATCH_DURATION = 8;

export default function AdPlayer({ ad, onComplete, onClose }: AdPlayerProps) {
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState(WATCH_DURATION);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setCompleted(true);
      onComplete();
      return;
    }
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="relative bg-gradient-to-r from-purple-900 to-pink-900 p-6 text-white">
          <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/30">
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <Play className="w-6 h-6" />
            <span className="text-sm font-medium">
              {completed ? t('social.ads_reward_ready') : t('social.ads_earn_prompt', { amount: ad.reward_per_view })}
            </span>
          </div>

          {ad.media_url ? (
            <img src={ad.media_url} alt={ad.title} className="w-full h-48 object-cover rounded-lg mb-3" />
          ) : (
            <div className="w-full h-48 bg-purple-800 rounded-lg mb-3 flex items-center justify-center">
              <Play className="w-16 h-16 text-purple-400 animate-pulse" />
            </div>
          )}

          <h3 className="text-lg font-bold">{ad.title}</h3>
          <p className="text-sm text-purple-200 mt-1">{ad.content}</p>

          {!completed ? (
            <div className="mt-4">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-1000"
                  style={{ width: `${((WATCH_DURATION - countdown) / WATCH_DURATION) * 100}%` }}
                />
              </div>
              <p className="text-center text-sm mt-2 text-purple-200">
                {t('social.ads_please_wait', { seconds: countdown })}
              </p>
            </div>
          ) : (
            <div className="mt-4 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{t('social.ads_reward', { amount: ad.reward_per_view })}</div>
              <p className="text-sm text-purple-200">{t('social.ads_reward_credited')}</p>
            </div>
          )}
        </div>

        {ad.target_url && completed && (
          <div className="p-4">
            <a
              href={ad.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50"
            >
              {ad.call_to_action || t('social.ads_watch')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
