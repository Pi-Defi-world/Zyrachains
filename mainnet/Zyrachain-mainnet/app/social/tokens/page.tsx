'use client';

import React, { useEffect, useState } from 'react';
import { useSocial } from '@/context/SocialContext';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { useLanguage } from '@/context/languagecontext';
import { socialAPI } from '@/lib/social-api-client';
import TokenBalance from '@/components/social/TokenBalance';
import { Coins, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

export default function TokensPage() {
  const { isAuthenticated } = usePiNetwork();
  const { tokenBalance, refreshBalance } = useSocial();
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      try {
        const data = await socialAPI.getTransactions(1, 30);
        setTransactions(data.data || []);
      } catch (err) {
        console.error('Failed to load transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    refreshBalance();
  }, [isAuthenticated, refreshBalance]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{t('social.connect_tokens')}</p>
      </div>
    );
  }

  const txLabel = (type: string): string => {
    const map: Record<string, string> = {
      purchase: String(t('social.tx_purchase')),
      post_cost: String(t('social.tx_post')),
      comment_cost: String(t('social.tx_comment')),
      like_cost: String(t('social.tx_like')),
      dislike_cost: String(t('social.tx_dislike')),
      tip: String(t('social.tx_tip')),
      reshare_cost: String(t('social.tx_reshare')),
      boost_cost: String(t('social.tx_boost')),
      ad_reward: String(t('social.tx_ad_reward')),
      moderation_reward: String(t('social.tx_mod_reward')),
      moderation_loss: String(t('social.tx_mod_loss')),
      badge_purchase: String(t('social.tx_badge')),
      mission_reward: String(t('social.tx_mission')),
      refund: String(t('social.tx_refund')),
      platform_fee: String(t('social.tx_platform_fee')),
      creator_earning: String(t('social.tx_creator_earning')),
    };
    return map[type] || type;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('social.tokens')}</h1>

      <TokenBalance />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <p className="text-xs text-purple-600 dark:text-purple-400">{t('social.balance_earned')}</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
              {tokenBalance?.earned_balance?.toFixed(2) || '0.00'} ZP
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <p className="text-xs text-green-600 dark:text-green-400">{t('social.balance_purchased')}</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">
              {tokenBalance?.purchased_balance?.toFixed(2) || '0.00'} ZP
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">{t('social.balance_ad')}</p>
            <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
              {tokenBalance?.ad_balance?.toFixed(2) || '0.00'} ZP
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <p className="text-xs text-red-600 dark:text-red-400">{t('social.balance_spent')}</p>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">
              {tokenBalance?.total_spent?.toFixed(2) || '0.00'} ZP
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> {t('social.transactions_title')}
        </h2>

        {loading ? (
          <p className="text-sm text-gray-400">{t('social.loading')}</p>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Coins className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>{t('social.transactions_empty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx._id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {tx.tx_type?.includes('reward') || tx.tx_type === 'purchase' || tx.tx_type?.includes('earning') ? (
                    <ArrowDownLeft className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {txLabel(tx.tx_type)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${
                  tx.tx_type?.includes('reward') || tx.tx_type === 'purchase' || tx.tx_type?.includes('earning')
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {tx.tx_type?.includes('reward') || tx.tx_type === 'purchase' || tx.tx_type?.includes('earning') ? '+' : '-'}
                  {tx.amount} ZP
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
