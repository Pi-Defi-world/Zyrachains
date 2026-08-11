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
    if (isNaN(tipAmount) || tipAmount < 1) return setError(t('social.tip_min_error', { min: 1 }));
    if (tokenBalance && tokenBalance.balance < tipAmount) {
      return setError(t('social.composer_error_balance', { cost: tipAmount }));
    }

    setSubmitting(true);
    setError('');
    try {
      await tipPost(post._id, tipAmount);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Tip failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('social.tip_modal_title')}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {t('social.tip_amount_label', { user: post.author_uid?.slice(0, 8) })}
          </p>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => { setAmount(amt); setCustomAmount(''); }}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  amount === amt && !customAmount
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {amt} ZP
              </button>
            ))}
          </div>

          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Custom amount..."
            min="1"
            step="1"
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          {error && (
            <div className="mt-2 text-xs text-red-500">{error}</div>
          )}

          <div className="mt-3 text-xs text-gray-400">
            {t('social.tip_creator_share', { amount: (tipAmount * 0.8).toFixed(2) })}
          </div>

          <button
            onClick={handleTip}
            disabled={submitting || (isNaN(tipAmount) || tipAmount < 1)}
            className="w-full mt-3 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-medium text-sm hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 transition-all"
          >
            {submitting ? t('social.tip_sending') : t('social.tip_send', { amount: isNaN(tipAmount) ? '--' : tipAmount })}
          </button>
        </div>
      </div>
    </div>
  );
}
