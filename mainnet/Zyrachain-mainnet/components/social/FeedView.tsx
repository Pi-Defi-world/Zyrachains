'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSocial } from '@/context/SocialContext';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { useLanguage } from '@/context/languagecontext';
import { socialAPI } from '@/lib/social-api-client';
import PostCard from './PostCard';
import PostComposer from './PostComposer';
import FeedTabs from './FeedTabs';
import BadgeDisplay from './BadgeDisplay';
import EcosystemWidget from './EcosystemWidget';
import { Plus, Loader2, Trophy, Medal, Zap, Award } from 'lucide-react';

export default function FeedView() {
  const { isAuthenticated, user } = usePiNetwork();
  const { feed, feedType, feedLoading, hasMore, loadMoreFeed } = useSocial();
  const { t } = useLanguage();
  const [showComposer, setShowComposer] = React.useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const [leaderboardEntries, setLeaderboardEntries] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    if (feedType !== 'leaderboard') return;
    let cancelled = false;
    const load = async () => {
      setLeaderboardLoading(true);
      try {
        const [lbData, badgeData] = await Promise.all([
          socialAPI.getLeaderboard(1, 100),
          socialAPI.getUserBadges(user?.uid || ''),
        ]);
        if (cancelled) return;
        setLeaderboardEntries(lbData.data || []);
        setBadges(badgeData.data || []);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        if (!cancelled) setLeaderboardLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [feedType, isAuthenticated, user?.uid]);

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

  const rankColors = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    if (rank === 2) return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300';
    if (rank === 3) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
    return '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-heading-sm text-foreground lg:hidden">{t('social.feed')}</h1>
        {feedType !== 'leaderboard' && (
          <button onClick={() => setShowComposer(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-foreground rounded-md text-xs font-semibold hover:bg-accent/90 lg:hidden">
            <Plus className="w-3.5 h-3.5" /> {t('social.post_submit')}
          </button>
        )}
      </div>

      {/* Ecosystem analytics alongside the feed (mobile) */}
      <div className="lg:hidden mb-3">
        <EcosystemWidget />
      </div>

      <FeedTabs />

      {feedType !== 'leaderboard' && (
        <button onClick={() => setShowComposer(true)} className="hidden lg:flex items-center gap-2 w-full px-4 py-3 card-elevated text-muted-foreground text-sm mb-4 hover:border-accent/40 cursor-text">
          <Plus className="w-4 h-4" /> {t('social.composer_placeholder')}
        </button>
      )}

      {feedType === 'leaderboard' ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h1 className="text-xl font-bold text-foreground">{t('social.leaderboard_title')}</h1>
          </div>

          {leaderboardLoading ? (
            <p className="text-muted-foreground text-center py-8">{t('social.loading')}</p>
          ) : leaderboardEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>{t('social.leaderboard_empty')}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {leaderboardEntries.map((entry: any) => (
                <a
                  key={entry.user_uid}
                  href={`/social/profile/${entry.user_uid}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/40 hover:border-accent/40 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${rankColors(entry.rank)}`}>
                    {entry.rank <= 3 ? <Medal className="w-5 h-5" /> : `#${entry.rank}`}
                  </div>

                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                    {entry.username?.slice(0, 1).toUpperCase() || 'U'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {entry.username || entry.user_uid?.slice(0, 8) + '...'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Zap className="w-3 h-3" /> {t('social.gamification_level', { level: entry.level })}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      {entry.weekly_xp?.toLocaleString()} {t('social.leaderboard_xp')}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('social.leaderboard_total', { xp: entry.xp?.toLocaleString() })}</p>
                  </div>
                </a>
              ))}
            </div>
          )}

          <div className="border-t border-border pt-6">
            <h2 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-accent" /> {t('social.badge_yours')}
            </h2>
            {badges.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('social.badges')} — {t('social.badge_earned')}</p>
            ) : (
              <BadgeDisplay badges={badges} max={10} />
            )}
            <div className="mt-3">
              <a href="/social/badges" className="text-xs text-accent hover:underline">
                {t('social.badges')} →
              </a>
            </div>
          </div>
        </div>
      ) : feed.length === 0 && !feedLoading ? (
        <div className="text-center py-12"><p className="text-sm text-muted-foreground">{t('social.noPosts')}</p></div>
      ) : (
        <>{feed.map((post) => (<PostCard key={post._id} post={post} />))}</>
      )}

      {feedType !== 'leaderboard' && (
        <div ref={observerRef} className="h-10 flex items-center justify-center">
          {feedLoading && <Loader2 className="w-5 h-5 text-accent animate-spin" />}
          {!hasMore && feed.length > 0 && <p className="text-xs text-muted-foreground">{t('social.noMorePosts')}</p>}
        </div>
      )}

      {showComposer && <PostComposer onClose={() => setShowComposer(false)} />}
    </div>
  );
}
