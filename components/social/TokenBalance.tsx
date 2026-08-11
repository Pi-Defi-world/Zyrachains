'use client';

import React, { useState } from 'react';
import { Coin, Plus, X } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { useLanguage } from '@/context/languagecontext';

export default function TokenBalance() {
  const { tokenBalance, refreshBalance } = useSocial();
  const { createPayment, user } = usePiNetwork();
  const { t } = useLanguage();
  const [showBuy, setShowBuy] = useState(false);
  const [piAmount, setPiAmount] = useState(1);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');

  const handleBuy = async () => {
    if (!piAmount || piAmount < 0.01) return;
    if (!user?.uid) { setBuyError(t('social.composer_error_required')); return; }
    setBuying(true);
    setBuyError('');
    try {
      const result = await createPayment({
        amount: piAmount,
        memo: `${t('social.buy_receive', { amount: piAmount * 100 })}`,
        metadata: {
          listingType: 'social_tokens',
          listingData: { piAmount, userId: user.uid },
        },
      });
      if (result.success) {
        setShowBuy(false);
        alert(t('social.buy_success'));
      } else {
        setBuyError(result.error || 'Payment failed');
      }
    } catch (err: any) {
      setBuyError(err.message || 'Purchase failed');
    } finally {
      setBuying(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-full px-3 py-1.5 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors" onClick={() => setShowBuy(!showBuy)}>
          <Coin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
            {tokenBalance ? tokenBalance.balance.toFixed(2) : '0.00'} ZP
          </span>
          <Plus className="w-3 h-3 text-purple-500" />
        </div>
      </div>

      {showBuy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('social.buy_modal_title')}</h3>
              <button onClick={() => setShowBuy(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-4 text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{t('social.buy_rate')}</p>
              </div>

              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('social.buy_pi_amount')}</label>
              <div className="flex items-center gap-3 mb-3">
                {[0.1, 1, 5, 10].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setPiAmount(amt)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      piAmount === amt
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {amt} Pi
                  </button>
                ))}
              </div>

              <input
                type="number"
                value={piAmount}
                onChange={(e) => setPiAmount(parseFloat(e.target.value) || 0)}
                min="0.01"
                step="0.1"
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
                {t('social.buy_receive', { amount: piAmount * 100 })}
              </p>

              {tokenBalance && (
                <p className="text-xs text-gray-400 text-center mt-1">
                  {t('social.buy_current_balance', { balance: tokenBalance.balance.toFixed(2) })}
                </p>
              )}

              {buyError && (
                <div className="mt-2 text-xs text-red-500 text-center">{buyError}</div>
              )}

              <button
                onClick={handleBuy}
                disabled={buying || !piAmount || piAmount < 0.01}
                className="w-full mt-3 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium text-sm hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
              >
                {buying ? t('social.buy_processing') : t('social.buy_pay')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
