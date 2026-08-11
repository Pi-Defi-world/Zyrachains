'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Flame, Compass, Shield, Award, Trophy,
  DollarSign, Video, Users, TrendingUp,
} from 'lucide-react';
import { useLanguage } from '@/context/languagecontext';

export default function SocialNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: '/social', label: t('social.hub'), icon: Home },
    { href: '/social/feed', label: t('social.feed'), icon: Flame },
    { href: '/social/leaderboard', label: t('social.leaderboard'), icon: Trophy },
    { href: '/social/badges', label: t('social.badges'), icon: Award },
    { href: '/social/tokens', label: t('social.tokens'), icon: DollarSign },
    { href: '/social/ads', label: t('social.earn'), icon: Video },
    { href: '/social/moderation', label: t('social.moderate'), icon: Shield },
  ];

  return (
    <div className="flex flex-col gap-0.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              active
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
