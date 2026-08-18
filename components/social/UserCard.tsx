'use client';

import React from 'react';
import Link from 'next/link';
import { useSocial } from '@/context/SocialContext';
import Avatar from './Avatar';

export default function UserCard({ uid, username, avatar }: { uid: string; username?: string; avatar?: string | null }) {
  return (
    <Link
      href={`/social/profile/${uid}`}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <Avatar src={avatar} name={username || uid} size="sm" />
      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
        {username || uid?.slice(0, 8) + '...'}
      </div>
    </Link>
  );
}
