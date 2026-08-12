'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSocial } from '@/context/SocialContext';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { useLanguage } from '@/context/languagecontext';
import FollowButton from '@/components/social/FollowButton';
import BadgeDisplay from '@/components/social/BadgeDisplay';
import { Loader2, Users, UserPlus, FileText } from 'lucide-react';

export default function SocialProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const { user: currentUser } = usePiNetwork();
  const { getProfile } = useSocial();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) return;
    const load = async () => {
      try {
        const data = await getProfile(uid);
        setProfile(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uid, getProfile]);

  const isOwnProfile = currentUser?.uid === uid;

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
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shrink-0">
            {profile.username?.slice(0, 1).toUpperCase() || 'U'}
          </div>

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
      ) : (
        <p className="text-sm text-gray-400">Posts will appear here as the user creates them</p>
      )}
    </div>
  );
}
