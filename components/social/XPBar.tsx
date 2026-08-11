'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/languagecontext';

export default function XPBar() {
  const { gameStats } = useSocial();
  const { t } = useLanguage();
  if (!gameStats) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('social.gamification_level', { level: gameStats.level })}</span>
        </div>
        <span className="text-xs text-gray-500">{t('social.gamification_xp', { xp: gameStats.xp.toLocaleString() })}</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
          style={{ width: `${gameStats.progress_percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
        <span>{t('social.gamification_streak', { days: gameStats.streak_days })}</span>
        <span>{gameStats.progress_percent}%</span>
      </div>
    </div>
  );
}
