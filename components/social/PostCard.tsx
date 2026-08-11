'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Repeat2, Send, TrendingUp, Eye } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-3 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {post.author_uid?.slice(0, 1).toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/social/profile/${post.author_uid}`}
              className="font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 text-sm"
            >
              {post.author_uid?.slice(0, 8)}...
            </Link>
            {post.is_boosted && (
              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {t('social.promoted')}
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {timeAgo(post.createdAt)}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Eye className="w-3 h-3" /> {t('social.impressions', { count: post.impression_count || 0 })}
            </span>
          </div>

          <Link href={`/social/post/${post._id}`} className="block mt-1">
            <p className={`text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words ${detail ? '' : 'line-clamp-5'}`}>
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
            <div className="flex gap-1 mt-2 flex-wrap">
              {post.tags.map((tag: string, i: number) => (
                <span key={i} className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <PostActions post={post} detail={detail} />
        </div>
      </div>
    </div>
  );
}
