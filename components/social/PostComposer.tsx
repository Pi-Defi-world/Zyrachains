'use client';

import React, { useState } from 'react';
import { X, Hash } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/languagecontext';

interface PostComposerProps {
  onClose: () => void;
}

export default function PostComposer({ onClose }: PostComposerProps) {
  const { createPost } = useSocial();
  const { t } = useLanguage();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!content.trim()) return setError(t('social.composer_error_required'));
    if (content.length > 2000) return setError(t('social.composer_error_chars', { max: 2000 }));

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-lg shadow-md">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">{t('social.createPost')}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={String(t('social.composer_placeholder'))}
            maxLength={2000}
            rows={4}
            className="w-full bg-secondary/30 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />

          <div className="flex gap-1.5 mt-3 flex-wrap">
            {tags.map((tag, i) => (
              <span key={i} className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded flex items-center gap-1">
                #{tag}
                <button onClick={() => setTags(tags.filter((_, j) => j !== i))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder={String(t('social.composer_tags'))}
              className="flex-1 text-sm bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {error && (
            <div className="mt-3 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <span className="text-[10px] text-muted-foreground">
              {t('social.composer_chars', { current: content.length, max: 2000 })}
            </span>
            <button
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-md text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? t('social.posting') : t('social.post_submit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
