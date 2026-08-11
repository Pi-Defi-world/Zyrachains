'use client';

import React from 'react';
import { Flame, Clock, Users, Compass } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/languagecontext';

const tabs = [
  { key: 'trending', label: 'social.trending', icon: Flame },
  { key: 'following', label: 'social.following', icon: Users },
  { key: 'new', label: 'social.new', icon: Clock },
];

export default function FeedTabs() {
  const { feedType, setFeedType } = useSocial();
  const { t } = useLanguage();

  return (
    <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = feedType === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setFeedType(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${
              active
                ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {t(tab.label)}
          </button>
        );
      })}
    </div>
  );
}
