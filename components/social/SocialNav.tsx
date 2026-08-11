'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Flame, Trophy, Award, DollarSign, Video, Shield } from 'lucide-react';
import { useLanguage } from '@/context/languagecontext';

export default function SocialNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: '/social', label: String(t('social.hub')), icon: Home },
    { href: '/social/feed', label: String(t('social.feed')), icon: Flame },
    { href: '/social/leaderboard', label: String(t('social.leaderboard')), icon: Trophy },
    { href: '/social/badges', label: String(t('social.badges')), icon: Award },
    { href: '/social/tokens', label: String(t('social.tokens')), icon: DollarSign },
    { href: '/social/ads', label: String(t('social.earn')), icon: Video },
    { href: '/social/moderation', label: String(t('social.moderate')), icon: Shield },
  ];

  return (
    <div className="space-y-0.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname?.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs transition-colors ${
              active
                ? 'bg-accent/10 text-accent font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
            }`}
          >
            <span className="w-1 h-1 rounded-full bg-current opacity-40 flex-shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
