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
    <div className="card-elevated p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-yellow-500" />
          <span className="text-xs font-semibold text-foreground">{t('social.gamification_level', { level: gameStats.level })}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{t('social.gamification_xp', { xp: gameStats.xp.toLocaleString() })}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${gameStats.progress_percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
        <span>{t('social.gamification_streak', { days: gameStats.streak_days })}</span>
        <span>{gameStats.progress_percent}%</span>
      </div>
    </div>
  );
}
