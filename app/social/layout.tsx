'use client';

import React from 'react';
import SocialNav from '@/components/social/SocialNav';
import TokenBalance from '@/components/social/TokenBalance';
import XPBar from '@/components/social/XPBar';

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block w-64 shrink-0 border-r border-gray-200 dark:border-gray-700 p-4">
        <div className="mb-4">
          <TokenBalance />
        </div>
        <div className="mb-4">
          <XPBar />
        </div>
        <SocialNav />
      </div>
      <div className="flex-1 min-w-0 p-4 lg:p-6 max-w-3xl">
        {children}
      </div>
    </div>
  );
}
