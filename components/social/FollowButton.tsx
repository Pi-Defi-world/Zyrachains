'use client';

import React, { useState } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/languagecontext';

interface FollowButtonProps {
  targetUID: string;
  isFollowing: boolean;
  onToggle?: () => void;
}

export default function FollowButton({ targetUID, isFollowing: initialFollowing, onToggle }: FollowButtonProps) {
  const { followUser, unfollowUser } = useSocial();
  const { t } = useLanguage();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (following) {
        await unfollowUser(targetUID);
        setFollowing(false);
      } else {
        await followUser(targetUID);
        setFollowing(true);
      }
      onToggle?.();
    } catch (err) {
      console.error('Follow toggle error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
        following
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600'
          : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-sm'
      }`}
    >
      {following ? (
        <>
          <UserCheck className="w-4 h-4" /> {t('social.following_label')}
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" /> {t('social.follow')}
        </>
      )}
    </button>
  );
}
