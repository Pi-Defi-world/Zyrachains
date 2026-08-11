'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Gift } from 'lucide-react';
import { socialAPI } from '@/lib/social-api-client';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/languagecontext';

export default function MissionsPanel() {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshBalance, refreshGameStats } = useSocial();
  const { t } = useLanguage();

  const loadMissions = async () => {
    try {
      const data = await socialAPI.getMissions();
      setMissions(data.data || []);
    } catch (err) {
      console.error('Failed to load missions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMissions();
  }, []);

  const handleClaim = async (key: string) => {
    try {
      await socialAPI.claimMission(key);
      await loadMissions();
      await refreshBalance();
      await refreshGameStats();
    } catch (err) {
      console.error('Claim failed:', err);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-1.5 mb-3">
        <Gift className="w-4 h-4 text-purple-500" /> {t('social.gamification_daily_missions')}
      </h3>

      {missions.length === 0 ? (
        <p className="text-xs text-gray-400">{t('social.gamification_no_missions')}</p>
      ) : (
        <div className="space-y-2">
          {missions.map((m: any) => (
            <div key={m.mission_key} className="flex items-center gap-2">
              <div className="flex-1">
                <p className="text-xs text-gray-700 dark:text-gray-300">{m.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {m.progress}/{m.target}
                  </span>
                </div>
              </div>
              {m.completed && !m.claimed ? (
                <button
                  onClick={() => handleClaim(m.mission_key)}
                  className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded font-medium hover:bg-green-200"
                >
                  {t('social.gamification_claim', { reward: m.reward })}
                </button>
              ) : m.claimed ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
