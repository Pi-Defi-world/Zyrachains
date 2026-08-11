'use client';

import React, { useEffect, useState } from 'react';
import { useSocial } from '@/context/SocialContext';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { useLanguage } from '@/context/languagecontext';
import { socialAPI } from '@/lib/social-api-client';
import BadgeDisplay from '@/components/social/BadgeDisplay';
import { Award, ShoppingCart, Shield, Star } from 'lucide-react';

export default function BadgesPage() {
  const { isAuthenticated, user } = usePiNetwork();
  const { refreshBalance } = useSocial();
  const { t } = useLanguage();
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const load = async () => {
      try {
        const [badgesData, earnedData] = await Promise.all([
          socialAPI.getBadges(),
          socialAPI.getUserBadges(user.uid),
        ]);
        setAllBadges(badgesData.data || []);
        setEarnedBadges(earnedData.data || []);
      } catch (err) {
        console.error('Failed to load badges:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, user]);

  const handlePurchase = async (badgeId: string) => {
    try {
      await socialAPI.purchaseBadge(badgeId);
      await refreshBalance();
      const earnedData = await socialAPI.getUserBadges(user!.uid);
      setEarnedBadges(earnedData.data || []);
    } catch (err: any) {
      alert(err.message || 'Purchase failed');
    }
  };

  const earnedKeys = new Set(earnedBadges.map((b: any) => b.badge_key));

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{t('social.connect_badges')}</p>
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

  const categories = ['special', 'follower_based', 'achievement', 'paid', 'moderator'];
  const categoryLabels: Record<string, string> = {
    special: String(t('social.badge_special')),
    follower_based: String(t('social.badge_follower')),
    achievement: String(t('social.badge_achievement')),
    paid: String(t('social.badge_premium')),
    moderator: String(t('social.badge_moderation')),
  };
  const categoryIcons: Record<string, any> = { special: Star, follower_based: Star, achievement: Award, paid: ShoppingCart, moderator: Shield };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('social.badges')}</h1>

      {earnedBadges.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{t('social.badge_yours')}</h2>
          <BadgeDisplay badges={earnedBadges} max={10} />
        </div>
      )}

      {categories.map((cat) => {
        const badges = allBadges.filter((b: any) => b.category === cat);
        if (badges.length === 0) return null;
        const CatIcon = categoryIcons[cat];

        return (
          <div key={cat}>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-1.5">
              <CatIcon className="w-4 h-4 text-purple-500" /> {categoryLabels[cat]}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {badges.map((badge: any) => {
                const earned = earnedKeys.has(badge.badge_key);
                return (
                  <div key={badge._id} className={`p-3 rounded-lg border text-center ${earned ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{badge.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{badge.description}</p>
                    {badge.category === 'paid' && !earned && badge.price && (
                      <button onClick={() => handlePurchase(badge._id)} className="mt-2 text-xs px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700">
                        {t('social.badge_purchase', { price: badge.price })}
                      </button>
                    )}
                    {earned && (
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                        {t('social.badge_earned')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
