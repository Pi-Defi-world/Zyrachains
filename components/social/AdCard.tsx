'use client';

import React from 'react';
import { Play } from 'lucide-react';
import { useLanguage } from '@/context/languagecontext';

interface AdCardProps {
  ad: {
    _id: string;
    title: string;
    content: string;
    media_url: string;
    reward_per_view: number;
    ad_source: string;
    call_to_action: string;
  };
  onWatch: (adId: string) => void;
}

export default function AdCard({ ad, onWatch }: AdCardProps) {
  const { t } = useLanguage();
  const sourceLabel = ad.ad_source === 'google_ads' ? 'Google Ads' : ad.ad_source === 'pi_ads' ? 'Pi Ads' : 'Sponsored';

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-4 mb-3">
      <div className="flex items-start gap-3">
        {ad.media_url ? (
          <img src={ad.media_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-purple-200 dark:bg-purple-800 flex items-center justify-center">
            <Play className="w-8 h-8 text-purple-500" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded font-medium">Ad</span>
            <span className="text-xs text-gray-500">{sourceLabel}</span>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm mt-1">{ad.title}</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{ad.content}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
          {t('social.ads_reward', { amount: ad.reward_per_view })}
        </span>
        <button
          onClick={() => onWatch(ad._id)}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          <Play className="w-4 h-4" /> {ad.call_to_action || t('social.ads_watch')}
        </button>
      </div>
    </div>
  );
}
