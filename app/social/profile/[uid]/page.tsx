'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSocial } from '@/context/SocialContext';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { useLanguage } from '@/context/languagecontext';
import { socialAPI } from '@/lib/social-api-client';
import FollowButton from '@/components/social/FollowButton';
import BadgeDisplay from '@/components/social/BadgeDisplay';
import PostCard from '@/components/social/PostCard';
import Avatar from '@/components/social/Avatar';
import { Loader2, Users, UserPlus, FileText, Share2 } from 'lucide-react';

export default function SocialProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const { user: currentUser } = usePiNetwork();
  const { getProfile } = useSocial();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState('');
  const [postPage, setPostPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(false);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setPosts([]);
    setPostPage(1);
    const load = async () => {
      try {
        const data = await getProfile(uid);
        setProfile(data);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uid, getProfile]);

  const loadPosts = useCallback(async (page = 1) => {
    if (!uid) return;
    setPostsLoading(true);
    try {
      const data = await socialAPI.getUserPosts(uid, page, 20);
      setPosts((prev) => (page === 1 ? data.data || [] : [...prev, ...(data.data || [])]));
      setHasMorePosts((page * 20) < (data.pagination?.total || 0));
    } catch (err) {
      console.error('Failed to load user posts:', err);
    } finally {
      setPostsLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    if (uid) loadPosts(1);
  }, [uid, loadPosts]);

  const isOwnProfile = currentUser?.uid === uid;

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/social/profile/${uid}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Profile link copied to clipboard');
    } catch (err) {
      alert('Could not copy link');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{error || t('social.profile_not_found')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start gap-4">
          <Avatar src={profile.avatar} name={profile.username} size="xl" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {profile.username || uid?.slice(0, 8) + '...'}
              </h1>
              {!isOwnProfile && (
                <FollowButton
                  targetUID={uid}
                  isFollowing={profile.is_following}
                />
              )}
              <button
                onClick={handleShareProfile}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent/50 hover:text-foreground transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> {t('social.share')}
              </button>
            </div>

            {profile.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{profile.bio}</p>
            )}

            <BadgeDisplay badges={profile.badges || []} />

            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span className="font-semibold text-gray-900 dark:text-white">{profile.follower_count}</span> {String(t('social.followers', { count: profile.follower_count }))}
              </div>
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <UserPlus className="w-4 h-4" />
                <span className="font-semibold text-gray-900 dark:text-white">{profile.following_count}</span> {String(t('social.following_count', { count: profile.following_count }))}
              </div>
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <FileText className="w-4 h-4" />
                <span className="font-semibold text-gray-900 dark:text-white">{profile.post_count}</span> {String(t('social.posts_count', { count: profile.post_count }))}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>{t('social.gamification_level', { level: profile.level })}</span>
              <span>{t('social.gamification_xp', { xp: profile.xp?.toLocaleString() })}</span>
              <span>{profile.balance?.toFixed(2)} ZP</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t('social.posts_count', { count: profile.post_count })}</h2>
      {profile.post_count === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>{t('social.no_posts_profile')}</p>
        </div>
      ) : postsLoading && posts.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
          {hasMorePosts && (
            <button
              onClick={() => loadPosts(postPage + 1).then(() => setPostPage((p) => p + 1))}
              disabled={postsLoading}
              className="w-full mt-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg disabled:opacity-50"
            >
              {postsLoading ? t('social.loading') : t('social.load_more')}
            </button>
          )}
        </>
      )}
    </div>
  );
}