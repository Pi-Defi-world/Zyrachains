'use client';

import React from 'react';
import Link from 'next/link';
import { useSocial } from '@/context/SocialContext';

export default function UserCard({ uid, username, avatar }: { uid: string; username?: string; avatar?: string | null }) {
  return (
    <Link
      href={`/social/profile/${uid}`}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
        {(username || uid)?.slice(0, 1).toUpperCase()}
      </div>
      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
        {username || uid?.slice(0, 8) + '...'}
      </div>
    </Link>
  );
}
