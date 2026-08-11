'use client';

import React from 'react';

interface BadgeDisplayProps {
  badges: Array<{
    badge_key: string;
    name: string;
    icon: string;
    tier?: number;
  }>;
  max?: number;
}

const tierColors: Record<number, string> = {
  1: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  2: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  3: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  4: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
};

export default function BadgeDisplay({ badges, max = 5 }: BadgeDisplayProps) {
  if (!badges || badges.length === 0) return null;

  const visible = badges.slice(0, max);
  const remaining = badges.length - max;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map((badge, i) => (
        <span
          key={badge.badge_key || i}
          title={badge.name}
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${
            tierColors[badge.tier || 1]
          }`}
        >
          {badge.icon} {badge.name}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">+{remaining}</span>
      )}
    </div>
  );
}
