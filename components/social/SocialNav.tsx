'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Award, Coins, Megaphone, ShieldAlert, Trophy, User } from 'lucide-react';
import { useLanguage } from '@/context/languagecontext';

export default function SocialNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: '/social/badges', label: String(t('social.badges')), icon: Award },
    { href: '/social/tokens', label: String(t('social.tokens')), icon: Coins },
    { href: '/social/ads', label: String(t('social.ads_title')), icon: Megaphone },
    { href: '/social/moderation', label: String(t('social.moderate_title')), icon: ShieldAlert },
    { href: '/social/leaderboard', label: String(t('social.leaderboard_title')), icon: Trophy },
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
            <Icon className="w-3.5 h-3.5" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
