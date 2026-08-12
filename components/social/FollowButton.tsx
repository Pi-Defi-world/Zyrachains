'use client';

import React, { useState } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/languagecontext';
import { useToast } from '@/components/context/ToastContext';

interface FollowButtonProps {
  targetUID: string;
  isFollowing: boolean;
  onToggle?: () => void;
}

export default function FollowButton({ targetUID, isFollowing: initialFollowing, onToggle }: FollowButtonProps) {
  const { followUser, unfollowUser } = useSocial();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (following) { await unfollowUser(targetUID); setFollowing(false); }
      else { await followUser(targetUID); setFollowing(true); showToast('Now following', 'success'); }
      onToggle?.();
    } catch (err) { console.error('Follow toggle error:', err); } finally { setLoading(false); }
  };

  return (
    <button onClick={handleToggle} disabled={loading} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${following ? 'bg-secondary text-foreground hover:bg-destructive/10 hover:text-destructive' : 'bg-accent text-accent-foreground hover:bg-accent/90'}`}>
      {following ? <><UserCheck className="w-3.5 h-3.5" /> {t('social.following_label')}</> : <><UserPlus className="w-3.5 h-3.5" /> {t('social.follow')}</>}
    </button>
  );
}
