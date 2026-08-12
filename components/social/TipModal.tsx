'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/languagecontext';

interface TipModalProps {
  post: any;
  onClose: () => void;
}

const PRESET_AMOUNTS = [1, 5, 10, 50, 100];

export default function TipModal({ post, onClose }: TipModalProps) {
  const { tipPost, tokenBalance } = useSocial();
  const { t } = useLanguage();
  const [amount, setAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const tipAmount = customAmount ? parseFloat(customAmount) : amount;

  const handleTip = async () => {
    if (isNaN(tipAmount) || tipAmount < 1) return setError(String(t('social.tip_min_error', { min: 1 })));
    if (tokenBalance && tokenBalance.balance < tipAmount) {
      return setError(String(t('social.composer_error_balance', { cost: tipAmount })));
    }
    setSubmitting(true);
    setError('');
    try { await tipPost(post._id, tipAmount); onClose(); } catch (err: any) { setError(err.message || 'Tip failed'); } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-sm shadow-md">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">{t('social.tip_modal_title')}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-3">{t('social.tip_amount_label', { user: post.author_uid?.slice(0, 8) })}</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {PRESET_AMOUNTS.map((amt) => (
              <button key={amt} onClick={() => { setAmount(amt); setCustomAmount(''); }} className={`py-2 rounded text-xs font-medium transition-colors ${amount === amt && !customAmount ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/70'}`}>{amt} ZP</button>
            ))}
          </div>
          <input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="Custom amount..." min="1" step="1" className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          {error && <div className="mt-2 text-xs text-destructive">{error}</div>}
          <div className="mt-3 text-[10px] text-muted-foreground">{t('social.tip_creator_share', { amount: (tipAmount * 0.8).toFixed(2) })}</div>
          <button onClick={handleTip} disabled={submitting || (isNaN(tipAmount) || tipAmount < 1)} className="w-full mt-3 py-2 bg-accent text-accent-foreground rounded-md text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 transition-colors">
            {submitting ? t('social.tip_sending') : t('social.tip_send', { amount: isNaN(tipAmount) ? '--' : tipAmount })}
          </button>
        </div>
      </div>
    </div>
  );
}
