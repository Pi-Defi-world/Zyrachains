'use client';

import React, { useEffect, useState } from 'react';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { useLanguage } from '@/context/languagecontext';
import { socialAPI } from '@/lib/social-api-client';
import PostCard from '@/components/social/PostCard';
import { Shield, Flag, CheckCircle, Loader2 } from 'lucide-react';

export default function ModerationPage() {
  const { isAuthenticated } = usePiNetwork();
  const { t } = useLanguage();
  const [queue, setQueue] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [staked, setStaked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      try {
        const [queueData, statsData] = await Promise.all([
          socialAPI.getModerationQueue(),
          socialAPI.getModerationStats(),
        ]);
        setQueue(queueData.data || []);
        setStats(statsData.data);
        setStaked(statsData.data?.is_moderator);
      } catch (err) {
        console.error('Failed to load moderation data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  const handleStake = async () => {
    try {
      await socialAPI.stakeModerator();
      setStaked(true);
      const statsData = await socialAPI.getModerationStats();
      setStats(statsData.data);
      alert(t('social.staked_success', { amount: 50 }));
    } catch (err: any) {
      alert(err.message || 'Staking failed');
    }
  };

  const handleVote = async (postId: string, vote: 'flag' | 'approve') => {
    try {
      await socialAPI.castModerationVote(postId, vote);
      setQueue(queue.filter((p) => p._id !== postId));
      const statsData = await socialAPI.getModerationStats();
      setStats(statsData.data);
    } catch (err: any) {
      alert(err.message || 'Vote failed');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{t('social.connect_moderate')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-purple-500" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('social.moderate_title')}</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
            <p className="text-xs text-gray-500">{t('social.moderate_votes')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total_votes}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
            <p className="text-xs text-gray-500">{t('social.moderate_accuracy')}</p>
            <p className="text-lg font-bold text-green-600">{stats.accuracy}%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
            <p className="text-xs text-gray-500">{t('social.moderate_staked')}</p>
            <p className="text-lg font-bold text-purple-600">{stats.total_staked} ZP</p>
          </div>
        </div>
      )}

      {!staked ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <Shield className="w-12 h-12 text-purple-300 dark:text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('social.moderate_become')}</h3>
          <p className="text-sm text-gray-500 mb-4">{t('social.moderate_stake_desc', { amount: 50 })}</p>
          <button onClick={handleStake} className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium text-sm hover:from-purple-700 hover:to-pink-700">
            {t('social.moderate_stake_btn', { amount: 50 })}
          </button>
        </div>
      ) : (
        <>
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-500" /> {t('social.moderate_queue')} ({queue.length})
          </h2>

          {queue.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>{t('social.moderate_empty')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((post) => (
                <div key={post._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <PostCard post={post} />
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleVote(post._id, 'approve')} className="flex-1 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50">
                      {t('social.moderate_approve', { stake: 5 })}
                    </button>
                    <button onClick={() => handleVote(post._id, 'flag')} className="flex-1 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50">
                      {t('social.moderate_flag', { stake: 5 })}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
