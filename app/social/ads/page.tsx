'use client';

import React, { useEffect, useState } from 'react';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/languagecontext';
import { useToast } from '@/components/context/ToastContext';
import { socialAPI } from '@/lib/social-api-client';
import { PiAdsService } from '@/lib/pi-ads-service';
import AdCard from '@/components/social/AdCard';
import AdPlayer from '@/components/social/AdPlayer';
import { Play, Video, Clock, Coins, ExternalLink } from 'lucide-react';

export default function AdsPage() {
  const { isAuthenticated, accessToken } = usePiNetwork();
  const { refreshBalance } = useSocial();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [adsData, setAdsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [watchingAd, setWatchingAd] = useState<any>(null);
  const [piAdsSupported, setPiAdsSupported] = useState(false);
  const [showingPiAd, setShowingPiAd] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      socialAPI.getAds().then(d => setAdsData(d.data)).catch(() => {}),
      PiAdsService.isAdSupported().then(s => setPiAdsSupported(s)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(async () => {
      try { const d = await socialAPI.getAds(); setAdsData(d.data); } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleWatchCustom = (adId: string) => {
    const ad = adsData?.ads?.find((a: any) => a._id === adId);
    if (ad) setWatchingAd(ad);
  };

  const handleAdComplete = async () => {
    if (!watchingAd) return;
    try {
      const result = await socialAPI.watchAd(watchingAd._id);
      await refreshBalance();
      showToast(String(t('social.ads_earned_toast', { amount: result.data.reward })), 'success');
      const refreshed = await socialAPI.getAds();
      setAdsData(refreshed.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to claim reward', 'error');
    } finally {
      setWatchingAd(null);
    }
  };

  const handlePiRewardedAd = async () => {
    setShowingPiAd(true);
    try {
      const result = await PiAdsService.showRewardedAd();
      if (result?.rewarded) {
        const verified = await PiAdsService.verifyRewardedAd(result.adId, accessToken || '');
        if (verified) {
          await refreshBalance();
          showToast('+5 ZP earned from Pi Ads!', 'success');
          const refreshed = await socialAPI.getAds();
          setAdsData(refreshed.data);
        } else {
          showToast('Ad verification failed', 'warning');
        }
      } else {
        showToast('Pi Ads not available right now', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Pi Ads failed', 'error');
    } finally {
      setShowingPiAd(false);
    }
  };

  if (!isAuthenticated) {
    return <div className="text-center py-20"><p className="text-muted-foreground">{t('social.connect_earn')}</p></div>;
  }

  if (loading) {
    return <div className="text-center py-20"><p className="text-muted-foreground">{t('social.loading')}</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Video className="w-5 h-5 text-accent" />
        <h1 className="text-lg sm:text-xl font-bold text-foreground">{t('social.ads_title')}</h1>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="card-elevated p-3 sm:p-4 text-center">
          <Clock className="w-4 h-4 text-accent mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">{t('social.ads_daily_limit')}</p>
          <p className="text-lg font-bold text-foreground">{adsData?.daily_limit || 10}</p>
        </div>
        <div className="card-elevated p-3 sm:p-4 text-center">
          <Play className="w-4 h-4 text-accent mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">{t('social.ads_watched')}</p>
          <p className="text-lg font-bold text-foreground">{adsData?.watched_today || 0}</p>
        </div>
        <div className="card-elevated p-3 sm:p-4 text-center">
          <Coins className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">{t('social.ads_remaining')}</p>
          <p className="text-lg font-bold text-accent">{adsData?.remaining || 0}</p>
        </div>
      </div>

      {piAdsSupported && (
        <div className="card-elevated p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Pi Network Ads</p>
                <p className="text-xs text-muted-foreground">Watch a Pi rewarded ad to earn 5 ZP</p>
              </div>
            </div>
            <button
              onClick={handlePiRewardedAd}
              disabled={showingPiAd}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-md text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {showingPiAd ? 'Loading...' : 'Watch +5 ZP'}
            </button>
          </div>
        </div>
      )}

      {adsData?.remaining === 0 && !piAdsSupported ? (
        <div className="card-elevated p-8 text-center">
          <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground">{t('social.ads_limit_reached')}</p>
        </div>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-foreground">{t('social.ads_available')}</h2>
          {!adsData?.ads?.length ? (
            <p className="text-muted-foreground text-center py-8">{t('social.ads_none')}</p>
          ) : (
            <div>
              {adsData.ads.map((ad: any) => (
                <AdCard key={ad._id} ad={ad} onWatch={handleWatchCustom} />
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
