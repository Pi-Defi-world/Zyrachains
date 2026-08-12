'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { socialAPI } from '@/lib/social-api-client';
import PostCard from '@/components/social/PostCard';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/languagecontext';
import { useToast } from '@/components/context/ToastContext';
import { Loader2, Send, Link2 } from 'lucide-react';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const { refreshBalance } = useSocial();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [postData, commentsData] = await Promise.all([
          socialAPI.getPost(id),
          socialAPI.getComments(id),
        ]);
        const p = postData.data;
        setPost(p);
        setComments(commentsData.data || []);

        if (p?.tags?.length) {
          try {
            const q = p.tags.slice(0, 3).join(' ');
            const searchData = await socialAPI.searchPosts(q, 1, 4);
            const related = (searchData.data || []).filter((rp: any) => rp._id !== id).slice(0, 3);
            setRelatedPosts(related);
          } catch {}
        }
      } catch (err) {
        console.error('Failed to load post:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await socialAPI.addComment(id, commentText.trim());
      setCommentText('');
      showToast('Comment added', 'success');
      await refreshBalance();
      const commentsData = await socialAPI.getComments(id);
      setComments(commentsData.data || []);
    } catch (err) {
      console.error('Comment failed:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;
  }

  if (!post) {
    return <div className="text-center py-20"><p className="text-muted-foreground">{t('social.post_not_found')}</p></div>;
  }

  return (
    <div className="pb-20 sm:pb-0">
      <PostCard post={post} detail />

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {t('social.comments_title')} ({comments.length})
        </h3>

        <div className="flex items-center gap-2 mb-4">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={String(t('social.comments_placeholder', { cost: 0.5 }))}
            className="flex-1 bg-secondary/30 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <button onClick={handleAddComment} disabled={submittingComment || !commentText.trim()} className="p-2.5 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>

        {comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">{t('social.comments_empty')}</p>
        ) : (
          <div className="space-y-2">
            {comments.map((comment: any) => (
              <div key={comment._id} className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-[10px]">
                    {comment.author_uid?.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-foreground">{comment.author_uid?.slice(0, 8)}...</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-foreground/85 ml-8">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {relatedPosts.length > 0 && (
        <div className="mt-8 border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
            <Link2 className="w-3.5 h-3.5 text-accent" /> Related Posts
          </h3>
          <div className="space-y-3">
            {relatedPosts.map((rp: any) => (
              <PostCard key={rp._id} post={rp} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
