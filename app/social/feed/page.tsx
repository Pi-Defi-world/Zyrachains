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
  const { feed, feedLoading, hasMore, loadFeed, loadMoreFeed } = useSocial();
  const { t } = useLanguage();
  const [showComposer, setShowComposer] = React.useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadFeed('trending', 1); }, []);
  useEffect(() => {
    if (!observerRef.current) return;
    const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting && hasMore && !feedLoading) loadMoreFeed(); }, { threshold: 0.5 });
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, feedLoading, loadMoreFeed]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <h1 className="text-heading-md text-foreground mb-2">{t('social.feed')}</h1>
        <p className="text-sm text-muted-foreground">{t('social.connect_feed')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-heading-sm text-foreground lg:hidden">{t('social.feed')}</h1>
        <button onClick={() => setShowComposer(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-foreground rounded-md text-xs font-semibold hover:bg-accent/90 lg:hidden">
          <Plus className="w-3.5 h-3.5" /> {t('social.post_submit')}
        </button>
      </div>

      <FeedTabs />

      <button onClick={() => setShowComposer(true)} className="hidden lg:flex items-center gap-2 w-full px-4 py-3 card-elevated text-muted-foreground text-sm mb-4 hover:border-accent/40 cursor-text">
        <Plus className="w-4 h-4" /> {t('social.composer_placeholder')}
      </button>

      {feed.length === 0 && !feedLoading ? (
        <div className="text-center py-12"><p className="text-sm text-muted-foreground">{t('social.noPosts')}</p></div>
      ) : (
        <>{feed.map((post) => (<PostCard key={post._id} post={post} />))}</>
      )}

      <div ref={observerRef} className="h-10 flex items-center justify-center">
        {feedLoading && <Loader2 className="w-5 h-5 text-accent animate-spin" />}
        {!hasMore && feed.length > 0 && <p className="text-xs text-muted-foreground">{t('social.noMorePosts')}</p>}
      </div>

      {showComposer && <PostComposer onClose={() => setShowComposer(false)} />}
    </div>
  );
}
