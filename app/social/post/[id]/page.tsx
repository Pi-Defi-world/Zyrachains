'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { socialAPI } from '@/lib/social-api-client';
import PostCard from '@/components/social/PostCard';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/languagecontext';
import { Loader2, Send } from 'lucide-react';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
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
        setPost(postData.data);
        setComments(commentsData.data || []);
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
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{t('social.post_not_found')}</p>
      </div>
    );
  }

  return (
    <div>
      <PostCard post={post} detail />

      <div className="mt-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          {t('social.comments_title')} ({comments.length})
        </h3>

        <div className="flex items-center gap-2 mb-4">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={t('social.comments_placeholder', { cost: 0.5 })}
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <button
            onClick={handleAddComment}
            disabled={submittingComment || !commentText.trim()}
            className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">{t('social.comments_empty')}</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment: any) => (
              <div key={comment._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                    {comment.author_uid?.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {comment.author_uid?.slice(0, 8)}...
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
