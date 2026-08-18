'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Repeat2, TrendingUp, DollarSign, Share2 } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/languagecontext';
import { useToast } from '@/components/context/ToastContext';
import TipModal from './TipModal';
import BoostModal from './BoostModal';

interface PostActionsProps {
  post: any;
  detail?: boolean;
}

export default function PostActions({ post, detail = false }: PostActionsProps) {
  const { likePost, resharePost } = useSocial();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [showTip, setShowTip] = useState(false);
  const [showBoost, setShowBoost] = useState(false);
  const [liked, setLiked] = useState(false);
  const [animating, setAnimating] = useState<string | null>(null);

  const handleLike = async () => {
    if (liked) return;
    setAnimating('like');
    try { await likePost(post._id); setLiked(true); showToast(String(t('social.post_liked')), 'success'); } catch (err) {}
    setTimeout(() => setAnimating(null), 600);
  };

  const handleReshare = async () => {
    setAnimating('reshare');
    try { await resharePost(post._id); showToast(String(t('social.post_reshared')), 'success'); } catch (err) {}
    setTimeout(() => setAnimating(null), 600);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/social/post/${post._id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast(String(t('social.share_copied')), 'success');
    } catch (err) {
      showToast(String(t('social.share_failed')), 'error');
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 sm:gap-4 mt-3 pt-3 border-t border-border">
        <button onClick={handleLike} className={`inline-flex items-center gap-1 text-xs sm:text-sm transition-all ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'} ${animating === 'like' ? 'scale-125' : ''}`}>
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          <span className="font-medium">{post.like_count || 0}</span>
        </button>

        <Link href={`/social/post/${post._id}`} className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-blue-500 transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span className="font-medium">{post.comment_count || 0}</span>
        </Link>

        <button onClick={handleReshare} className={`inline-flex items-center gap-1 text-xs sm:text-sm transition-all ${animating === 'reshare' ? 'scale-125 text-green-500' : 'text-muted-foreground hover:text-green-500'}`}>
          <Repeat2 className="w-4 h-4" />
          <span className="font-medium">{post.reshare_count || 0}</span>
        </button>

        <button onClick={handleShare} className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-blue-500 transition-colors">
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t('social.share')}</span>
        </button>

        <button onClick={() => setShowTip(true)} className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-yellow-600 transition-colors">
          <DollarSign className="w-4 h-4" />
          <span className="hidden sm:inline">{t('social.tip')}</span>
        </button>

        <button onClick={() => setShowBoost(true)} className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-accent transition-colors ml-auto">
          <TrendingUp className="w-4 h-4" />
          <span className="hidden sm:inline">{t('social.boost')}</span>
        </button>
      </div>

      {post.tips_received > 0 && (
        <div className="mt-2 text-[10px] sm:text-xs text-yellow-600 flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          {t('social.tip_earned', { amount: post.tips_received })}
        </div>
      )}

      {showTip && <TipModal post={post} onClose={() => setShowTip(false)} />}
      {showBoost && <BoostModal post={post} onClose={() => setShowBoost(false)} />}
    </>
  );
}
