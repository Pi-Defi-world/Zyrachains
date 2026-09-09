'use client';

import React from 'react';
import { Flame, Clock, Users, Trophy } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/languagecontext';

const tabs = [
  { key: 'trending', label: 'social.trending', icon: Flame },
  { key: 'following', label: 'social.following', icon: Users },
  { key: 'new', label: 'social.new', icon: Clock },
  { key: 'leaderboard', label: 'social.leaderboard', icon: Trophy },
];

export default function FeedTabs() {
  const { feedType, setFeedType } = useSocial();
  const { t } = useLanguage();

  return (
    <div className="border-b border-border mb-6 flex gap-0 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = feedType === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setFeedType(tab.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
              active
                ? 'border-accent text-accent bg-accent/5 hover:bg-accent/10'
                : 'border-transparent text-foreground/60 hover:text-foreground/80 hover:bg-secondary/30'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {t(tab.label)}
          </button>
        );
      })}
    </div>
  );
}