'use client';

import React, { Suspense, ReactNode } from 'react';

export interface LoadingPriorityItem {
  key: string;
  priority: number; // Lower = higher priority (loads first)
  content: ReactNode;
  fallback: ReactNode;
}

interface LoadingPriorityProps {
  items: LoadingPriorityItem[];
  className?: string;
}

/**
 * Component to manage progressive loading of content in priority order
 * Items with lower priority numbers load first
 * Useful for loading critical UI elements before less important content
 */
export function LoadingPriority({ items, className = 'space-y-8 sm:space-y-12 lg:space-y-16' }: LoadingPriorityProps) {
  // Sort items by priority
  const sortedItems = [...items].sort((a, b) => a.priority - b.priority);

  return (
    <div className={className}>
      {sortedItems.map((item) => (
        <Suspense key={item.key} fallback={item.fallback}>
          {item.content}
        </Suspense>
      ))}
    </div>
  );
}

/**
 * Hook to create loading priority items for common patterns
 */
export function useLoadingPriority() {
  return {
    createItem: (key: string, priority: number, content: ReactNode, fallback: ReactNode): LoadingPriorityItem => ({
      key,
      priority,
      content,
      fallback,
    }),
  };
}
