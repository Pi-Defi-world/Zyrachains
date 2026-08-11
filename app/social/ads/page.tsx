'use client';

import React, { useEffect, useState } from 'react';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/languagecontext';
import { socialAPI } from '@/lib/social-api-client';
import AdCard from '@/components/social/AdCard';
import AdPlayer from '@/components/social/AdPlayer';
import { Play, Video, Clock, Coins } from 'lucide-react';

export default function AdsPage() {
  const { isAuthenticated } = usePiNetwork();
  const { refreshBalance } = useSocial();
  const { t } = useLanguage();
  const [adsData, setAdsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [watchingAd, setWatchingAd] = useState<any>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      try {
        const data = await socialAPI.getAds();
        setAdsData(data.data);
      } catch (err) {
        console.error('Failed to load ads:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  const handleWatch = (adId: string) => {
    const ad = adsData?.ads?.find((a: any) => a._id === adId);
    if (ad) setWatchingAd(ad);
  };

  const handleAdComplete = async () => {
    if (!watchingAd) return;
    try {
      const result = await socialAPI.watchAd(watchingAd._id);
      await refreshBalance();
      setMessage(String(t('social.ads_earned_toast', { amount: result.data.reward })));
      const refreshed = await socialAPI.getAds();
      setAdsData(refreshed.data);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(err.message || 'Failed to claim reward');
    } finally {
      setWatchingAd(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{t('social.connect_earn')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">{t('social.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Video className="w-6 h-6 text-purple-500" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('social.ads_title')}</h1>
      </div>

      {message && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg text-sm font-medium animate-pulse">
          {message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <Clock className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500">{t('social.ads_daily_limit')}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{adsData?.daily_limit || 10}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <Play className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500">{t('social.ads_watched')}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{adsData?.watched_today || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <Coins className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500">{t('social.ads_remaining')}</p>
          <p className="text-lg font-bold text-purple-600">{adsData?.remaining || 0}</p>
        </div>
      </div>

      {adsData?.remaining === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500">{t('social.ads_limit_reached')}</p>
        </div>
      ) : (
        <>
          <h2 className="font-semibold text-gray-900 dark:text-white">{t('social.ads_available')}</h2>
          {!adsData?.ads?.length ? (
            <p className="text-gray-400 text-center py-8">{t('social.ads_none')}</p>
          ) : (
            <div>
              {adsData.ads.map((ad: any) => (
                <AdCard key={ad._id} ad={ad} onWatch={handleWatch} />
              ))}
            </div>
          )}
        </>
      )}

      {watchingAd && (
        <AdPlayer ad={watchingAd} onComplete={handleAdComplete} onClose={() => setWatchingAd(null)} />
      )}
    </div>
  );
}
