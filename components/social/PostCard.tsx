'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Repeat2, TrendingUp, Eye } from 'lucide-react';
import { useLanguage } from '@/context/languagecontext';
import PostActions from './PostActions';

interface PostCardProps {
  post: any;
  detail?: boolean;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

export default function PostCard({ post, detail = false }: PostCardProps) {
  const { t } = useLanguage();

  return (
    <div className="card-elevated p-4 mb-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-xs shrink-0">
          {post.author_uid?.slice(0, 1).toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/social/profile/${post.author_uid}`}
              className="font-semibold text-foreground hover:text-accent text-sm"
            >
              {post.author_uid?.slice(0, 8)}...
            </Link>
            {post.is_boosted && (
              <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5" /> {t('social.promoted')}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              {timeAgo(post.createdAt)}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Eye className="w-3 h-3" /> {t('social.impressions', { count: post.impression_count || 0 })}
            </span>
          </div>

          <Link href={`/social/post/${post._id}`} className="block mt-1">
            <p className={`text-sm text-foreground/85 whitespace-pre-wrap break-words ${detail ? '' : 'line-clamp-5'}`}>
              {post.content}
            </p>
          </Link>

          {post.images && post.images.length > 0 && (
            <div className={`mt-2 grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {post.images.slice(0, 4).map((img: string, i: number) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  className="rounded-lg w-full object-cover max-h-64"
                  loading="lazy"
                />
              ))}
            </div>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {post.tags.map((tag: string, i: number) => (
                <Link
                  key={i}
                  href={`/social/feed?q=${encodeURIComponent(tag)}`}
                  className="text-[10px] text-accent bg-accent/10 hover:bg-accent/20 px-2 py-0.5 rounded transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <PostActions post={post} detail={detail} />
        </div>
      </div>
    </div>
  );
}
