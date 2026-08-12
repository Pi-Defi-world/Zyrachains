'use client';

import React, { useState } from 'react';
import { X, TrendingUp, Clock } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/languagecontext';

interface BoostModalProps {
  post: any;
  onClose: () => void;
}

const BOOST_PRESETS = [10, 25, 50, 100, 500];

export default function BoostModal({ post, onClose }: BoostModalProps) {
  const { boostPost, tokenBalance } = useSocial();
  const { t } = useLanguage();
  const [amount, setAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const boostAmount = customAmount ? parseFloat(customAmount) : amount;

  const handleBoost = async () => {
    if (isNaN(boostAmount) || boostAmount < 10) return setError(String(t('social.boost_min_error', { min: 10 })));
    if (tokenBalance && tokenBalance.balance < boostAmount) return setError(String(t('social.composer_error_balance', { cost: boostAmount })));
    setSubmitting(true); setError('');
    try { await boostPost(post._id, boostAmount); onClose(); } catch (err: any) { setError(err.message || 'Boost failed'); } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-sm shadow-md">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4 text-accent" /> {t('social.boost_modal_title')}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-3">{t('social.boost_desc')}</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {BOOST_PRESETS.map((amt) => (<button key={amt} onClick={() => { setAmount(amt); setCustomAmount(''); }} className={`py-2 rounded text-xs font-medium transition-colors ${amount === amt && !customAmount ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/70'}`}>{amt} ZP</button>))}
          </div>
          <input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="Custom amount..." min="10" step="1" className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          {error && <div className="mt-2 text-xs text-destructive">{error}</div>}
          <div className="mt-3 space-y-1 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t('social.boost_duration', { hours: 48 })}</div>
            <div>{t('social.boost_creator_share', { amount: (boostAmount * 0.5).toFixed(1) })}</div>
          </div>
          <button onClick={handleBoost} disabled={submitting || (isNaN(boostAmount) || boostAmount < 10)} className="w-full mt-3 py-2 bg-accent text-accent-foreground rounded-md text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 transition-colors">
            {submitting ? t('social.boosting') : t('social.boost_submit', { amount: isNaN(boostAmount) ? '--' : boostAmount })}
          </button>
        </div>
      </div>
    </div>
  );
}
