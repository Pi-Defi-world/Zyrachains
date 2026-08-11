'use client';

import React, { useState } from 'react';
import { Image, X, Hash } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/languagecontext';

interface PostComposerProps {
  onClose: () => void;
}

export default function PostComposer({ onClose }: PostComposerProps) {
  const { createPost, tokenBalance } = useSocial();
  const { t } = useLanguage();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const POST_COST = 2;

  const handleSubmit = async () => {
    if (!content.trim()) return setError(t('social.composer_error_required'));
    if (content.length > 2000) return setError(t('social.composer_error_chars', { max: 2000 }));
    if (tokenBalance && tokenBalance.balance < POST_COST) {
      return setError(t('social.composer_error_balance', { cost: POST_COST }));
    }

    setSubmitting(true);
    setError('');
    try {
      await createPost(content.trim(), undefined, tags);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg">{t('social.createPost')}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('social.composer_placeholder')}
            maxLength={2000}
            rows={4}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
          <div className="text-xs text-gray-400 mt-1 text-right">
            {t('social.composer_chars', { current: content.length, max: 2000 })}
          </div>

          <div className="flex gap-2 mt-3 flex-wrap">
            {tags.map((tag, i) => (
              <span key={i} className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                #{tag}
                <button onClick={() => setTags(tags.filter((_, j) => j !== i))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Hash className="w-4 h-4 text-gray-400" />
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder={t('social.composer_tags')}
              className="flex-1 text-sm bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400"
            />
          </div>

          {error && (
            <div className="mt-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('social.composer_cost', { cost: POST_COST })}
              {tokenBalance && (
                <span className="ml-2">
                  {t('social.composer_balance', { balance: tokenBalance.balance.toFixed(2) })}
                </span>
              )}
            </span>
            <button
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium text-sm hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? t('social.posting') : t('social.post_submit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
