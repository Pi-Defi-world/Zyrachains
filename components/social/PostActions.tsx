'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Repeat2, TrendingUp, Flag, DollarSign } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/languagecontext';
import TipModal from './TipModal';
import BoostModal from './BoostModal';

interface PostActionsProps {
  post: any;
  detail?: boolean;
}

export default function PostActions({ post, detail = false }: PostActionsProps) {
  const { likePost, tipPost, resharePost } = useSocial();
  const { t } = useLanguage();
  const [showTip, setShowTip] = useState(false);
  const [showBoost, setShowBoost] = useState(false);
  const [liked, setLiked] = useState(false);
  const [animating, setAnimating] = useState<string | null>(null);

  const handleLike = async () => {
    if (liked) return;
    setAnimating('like');
    try {
      await likePost(post._id);
      setLiked(true);
    } catch (err) {}
    setTimeout(() => setAnimating(null), 600);
  };

  const handleReshare = async () => {
    setAnimating('reshare');
    try {
      await resharePost(post._id);
    } catch (err) {}
    setTimeout(() => setAnimating(null), 600);
  };

  const openComments = () => {
    if (typeof window !== 'undefined') {
      window.location.href = `/social/post/${post._id}`;
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition-all ${
            liked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
          } ${animating === 'like' ? 'scale-125' : ''}`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          <span>{post.like_count || 0}</span>
        </button>

        <button
          onClick={openComments}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.comment_count || 0}</span>
        </button>

        <button
          onClick={handleReshare}
          className={`flex items-center gap-1.5 text-sm transition-all ${
            animating === 'reshare' ? 'scale-125 text-green-500' : 'text-gray-500 dark:text-gray-400 hover:text-green-500'
          }`}
        >
          <Repeat2 className="w-4 h-4" />
          <span>{post.reshare_count || 0}</span>
        </button>

        <button
          onClick={() => setShowTip(true)}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-yellow-500 transition-colors"
        >
          <DollarSign className="w-4 h-4" />
          <span>{t('social.tip')}</span>
        </button>

        <button
          onClick={() => setShowBoost(true)}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-500 transition-colors ml-auto"
        >
          <TrendingUp className="w-4 h-4" />
          <span>{t('social.boost')}</span>
        </button>
      </div>

      {post.tips_received > 0 && (
        <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          {t('social.tip_earned', { amount: post.tips_received })}
        </div>
      )}

      {showTip && <TipModal post={post} onClose={() => setShowTip(false)} />}
      {showBoost && <BoostModal post={post} onClose={() => setShowBoost(false)} />}
    </>
  );
}
