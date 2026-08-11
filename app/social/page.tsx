'use client';

import React from 'react';
import Link from 'next/link';
import { useSocial } from '@/context/SocialContext';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { useLanguage } from '@/context/languagecontext';
import PostCard from '@/components/social/PostCard';
import PostComposer from '@/components/social/PostComposer';
import TokenBalance from '@/components/social/TokenBalance';
import XPBar from '@/components/social/XPBar';
import MissionsPanel from '@/components/social/MissionsPanel';
import { Plus, Flame } from 'lucide-react';

export default function SocialHub() {
  const { isAuthenticated } = usePiNetwork();
  const { tokenBalance, gameStats, feed, loadFeed } = useSocial();
  const { t } = useLanguage();
  const [showComposer, setShowComposer] = React.useState(false);

  React.useEffect(() => {
    loadFeed('trending', 1);
  }, [loadFeed]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('social.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{t('social.connect_prompt')}</p>
      </div>
    );
  }

  const previewPosts = feed.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="lg:hidden space-y-3 mb-4">
        <TokenBalance />
        <XPBar />
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">{t('social.title')}</h1>
        <p className="text-purple-100 text-sm">{t('social.tagline')}</p>
        <div className="flex items-center gap-4 mt-4">
          <Link
            href="/social/feed"
            className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-all"
          >
            {t('social.viewFeed')}
          </Link>
          <button
            onClick={() => setShowComposer(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-50 transition-all"
          >
            <Plus className="w-4 h-4" /> {t('social.createPost')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t('social.trending')}</h2>
            {previewPosts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <Flame className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500">{t('social.noPosts')}</p>
              </div>
            ) : (
              <>
                {previewPosts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
                <Link
                  href="/social/feed?type=trending"
                  className="block text-center py-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                >
                  {t('social.view_all_trending')}
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4 hidden lg:block">
          <MissionsPanel />
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{t('social.quick_stats')}</h3>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>{t('social.balance')}</span>
                <span className="font-medium text-purple-600">{tokenBalance?.balance?.toFixed(2) || '0'} ZP</span>
              </div>
              <div className="flex justify-between">
                <span>{t('social.gamification_level', { level: gameStats?.level || 1 })}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('social.gamification_xp', { xp: gameStats?.xp?.toLocaleString() || 0 })}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('social.gamification_streak', { days: gameStats?.streak_days || 0 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showComposer && <PostComposer onClose={() => setShowComposer(false)} />}
    </div>
  );
}
