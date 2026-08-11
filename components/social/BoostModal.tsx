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
    if (isNaN(boostAmount) || boostAmount < 10) return setError(t('social.boost_min_error', { min: 10 }));
    if (tokenBalance && tokenBalance.balance < boostAmount) {
      return setError(t('social.composer_error_balance', { cost: boostAmount }));
    }

    setSubmitting(true);
    setError('');
    try {
      await boostPost(post._id, boostAmount);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Boost failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" /> {t('social.boost_modal_title')}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {t('social.boost_desc')}
          </p>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {BOOST_PRESETS.map((amt) => (
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
            min="10"
            step="1"
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          {error && (
            <div className="mt-2 text-xs text-red-500">{error}</div>
          )}

          <div className="mt-3 space-y-1 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {t('social.boost_duration', { hours: 48 })}
            </div>
            <div>{t('social.boost_creator_share', { amount: (boostAmount * 0.5).toFixed(1) })}</div>
          </div>

          <button
            onClick={handleBoost}
            disabled={submitting || (isNaN(boostAmount) || boostAmount < 10)}
            className="w-full mt-3 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium text-sm hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
          >
            {submitting ? t('social.boosting') : t('social.boost_submit', { amount: isNaN(boostAmount) ? '--' : boostAmount })}
          </button>
        </div>
      </div>
    </div>
  );
}
