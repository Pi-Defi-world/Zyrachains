'use client';

import React from 'react';
import SocialNav from '@/components/social/SocialNav';
import TokenBalance from '@/components/social/TokenBalance';
import XPBar from '@/components/social/XPBar';

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block w-64 shrink-0 border-r border-border p-4 pt-6">
        <div className="mb-4"><TokenBalance /></div>
        <div className="mb-4"><XPBar /></div>
        <SocialNav />
      </div>
      <div className="flex-1 min-w-0 px-3 sm:px-4 lg:px-6 py-4 lg:py-6 max-w-3xl mx-auto w-full">
        <div className="lg:hidden flex items-center justify-between mb-4 gap-2">
          <TokenBalance />
          <XPBar />
        </div>
        {children}
      </div>
    </div>
  );
}
