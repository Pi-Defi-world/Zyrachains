'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { MessageSquare, Heart, TrendingUp, ArrowRight, Flame } from 'lucide-react';

interface SocialPost {
  _id: string;
  author_uid: string;
  content: string;
  like_count: number;
  comment_count: number;
  tips_received: number;
  impression_count: number;
  is_boosted: boolean;
  createdAt: string;
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
  return `${days}d`;
}

export function HomeSocialSection() {
  const { isAuthenticated, accessToken } = usePiNetwork();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchTrending = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const url = `${base}/api/social/posts?type=trending&page=1&limit=3`;
        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setPosts(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch social posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [isAuthenticated, accessToken]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Trending on Zyra Social
        </h2>
        <Link
          href="/social/feed"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View Feed <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {!isAuthenticated ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            Connect your Pi account to see what the community is sharing
          </p>
          <button
            onClick={() => {
              const auth = (window as any)?.Pi;
              if (auth?.authenticate) {
                auth.authenticate(['username', 'payments', 'wallet_address'], () => {});
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            Connect to Zyra Social
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5 animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
              <div className="h-4 w-full bg-muted rounded mb-2" />
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="flex gap-3 mt-3">
                <div className="h-3 w-12 bg-muted rounded" />
                <div className="h-3 w-12 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
          <Flame className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No posts yet. Be the first to share on{' '}
            <Link href="/social" className="text-primary hover:underline">Zyra Social</Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/social/post/${post._id}`}
              className="group rounded-xl border border-border bg-card hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all duration-200 p-5 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {post.author_uid?.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-foreground block truncate">
                    {post.author_uid?.slice(0, 8)}...
                  </span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(post.createdAt)}</span>
                </div>
                {post.is_boosted && (
                  <span className="text-[10px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5 shrink-0">
                    <TrendingUp className="w-2.5 h-2.5" /> Promoted
                  </span>
                )}
              </div>

              <p className="text-sm text-foreground/80 line-clamp-3 flex-1 mb-3 group-hover:text-foreground transition-colors">
                {post.content}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/50">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" /> {post.like_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> {post.comment_count || 0}
                </span>
                {post.tips_received > 0 && (
                  <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 ml-auto">
                    {post.tips_received} ZP
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
