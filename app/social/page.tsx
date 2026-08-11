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

  React.useEffect(() => { loadFeed('trending', 1); }, [loadFeed]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-heading-lg text-foreground mb-2">{t('social.title')}</h1>
        <p className="text-sm text-muted-foreground mb-4">{t('social.connect_prompt')}</p>
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

      <div className="bg-accent rounded-lg p-6 text-accent-foreground">
        <h1 className="text-heading-md mb-1">{t('social.title')}</h1>
        <p className="text-sm opacity-80">{t('social.tagline')}</p>
        <div className="flex items-center gap-4 mt-4">
          <Link href="/social/feed" className="px-4 py-2 bg-accent-foreground/10 rounded-md text-xs font-semibold hover:bg-accent-foreground/20 transition-colors">
            {t('social.viewFeed')}
          </Link>
          <button onClick={() => setShowComposer(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-foreground text-accent rounded-md text-xs font-semibold hover:bg-accent-foreground/90 transition-colors">
            <Plus className="w-3.5 h-3.5" /> {t('social.createPost')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-heading-sm text-foreground">{t('social.trending')}</h2>
          {previewPosts.length === 0 ? (
            <div className="card-elevated p-8 text-center">
              <Flame className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('social.noPosts')}</p>
            </div>
          ) : (
            <>
              {previewPosts.map((post) => (<PostCard key={post._id} post={post} />))}
              <Link href="/social/feed?type=trending" className="block text-center py-2 text-xs text-accent hover:underline">
                {t('social.view_all_trending')}
              </Link>
            </>
          )}
        </div>

        <div className="space-y-4 hidden lg:block">
          <MissionsPanel />
          <div className="card-elevated p-4">
            <h3 className="text-xs font-semibold text-foreground mb-2">{t('social.quick_stats')}</h3>
            <div className="space-y-2 text-[10px] text-muted-foreground">
              <div className="flex justify-between"><span>{t('social.balance')}</span><span className="font-medium text-foreground">{tokenBalance?.balance?.toFixed(2) || '0'} ZP</span></div>
              <div className="flex justify-between"><span>{t('social.gamification_level', { level: gameStats?.level || 1 })}</span></div>
              <div className="flex justify-between"><span>{t('social.gamification_xp', { xp: gameStats?.xp?.toLocaleString() || 0 })}</span></div>
              <div className="flex justify-between"><span>{t('social.gamification_streak', { days: gameStats?.streak_days || 0 })}</span></div>
            </div>
          </div>
        </div>
      </div>

      {showComposer && <PostComposer onClose={() => setShowComposer(false)} />}
    </div>
  );
}
