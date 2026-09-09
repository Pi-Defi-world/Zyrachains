'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { useLanguage } from '@/context/languagecontext';
import { socialAPI } from '@/lib/social-api-client';
import { Trophy, Medal, Zap } from 'lucide-react';

export default function LeaderboardPage() {
  const { isAuthenticated } = usePiNetwork();
  const { t } = useLanguage();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      try {
        const data = await socialAPI.getLeaderboard(1, 100);
        setEntries(data.data || []);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{t('social.connect_leaderboard')}</p>
      </div>
    );
  }

  const rankColors = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    if (rank === 2) return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300';
    if (rank === 3) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
    return '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('social.leaderboard_title')}</h1>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-8">{t('social.loading')}</p>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>{t('social.leaderboard_empty')}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map((entry: any) => (
            <Link
              key={entry.user_uid}
              href={`/social/profile/${entry.user_uid}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${rankColors(entry.rank)}`}>
                {entry.rank <= 3 ? <Medal className="w-5 h-5" /> : `#${entry.rank}`}
              </div>

              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                {entry.username?.slice(0, 1).toUpperCase() || 'U'}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {entry.username || entry.user_uid?.slice(0, 8) + '...'}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Zap className="w-3 h-3" /> {t('social.gamification_level', { level: entry.level })}
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {entry.weekly_xp?.toLocaleString()} {t('social.leaderboard_xp')}
                </p>
                <p className="text-xs text-gray-400">{t('social.leaderboard_total', { xp: entry.xp?.toLocaleString() })}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
