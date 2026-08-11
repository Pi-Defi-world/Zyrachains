'use client';

import React, { useEffect, useRef } from 'react';
import { useSocial } from '@/context/SocialContext';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { useLanguage } from '@/context/languagecontext';
import PostCard from '@/components/social/PostCard';
import PostComposer from '@/components/social/PostComposer';
import FeedTabs from '@/components/social/FeedTabs';
import { Plus, Loader2 } from 'lucide-react';

export default function FeedPage() {
  const { isAuthenticated } = usePiNetwork();
  const { feed, feedType, feedLoading, hasMore, loadFeed, loadMoreFeed } = useSocial();
  const { t } = useLanguage();
  const [showComposer, setShowComposer] = React.useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFeed(feedType, 1);
  }, [feedType, loadFeed]);

  useEffect(() => {
    if (!observerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !feedLoading) {
          loadMoreFeed();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, feedLoading, loadMoreFeed]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('social.feed')}</h1>
        <p className="text-gray-500">{t('social.connect_feed')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white lg:hidden">{t('social.feed')}</h1>
        <button
          onClick={() => setShowComposer(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 lg:hidden"
        >
          <Plus className="w-4 h-4" /> {t('social.post_submit')}
        </button>
      </div>

      <FeedTabs />

      <button
        onClick={() => setShowComposer(true)}
        className="hidden lg:flex items-center gap-2 w-full px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm mb-4 hover:border-purple-300 dark:hover:border-purple-600 cursor-text"
      >
        <Plus className="w-4 h-4" /> {t('social.composer_placeholder')} ({t('social.post_cost', { cost: 2 })})
      </button>

      {feed.length === 0 && !feedLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">{t('social.noPosts')}</p>
        </div>
      ) : (
        <>
          {feed.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </>
      )}

      <div ref={observerRef} className="h-10 flex items-center justify-center">
        {feedLoading && <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />}
        {!hasMore && feed.length > 0 && (
          <p className="text-sm text-gray-400">{t('social.noMorePosts')}</p>
        )}
      </div>

      {showComposer && <PostComposer onClose={() => setShowComposer(false)} />}
    </div>
  );
}
