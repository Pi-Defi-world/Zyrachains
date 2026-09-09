'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

interface TickerProps {
  items: {
    id: string;
    title: string;
    value: string;
  }[];
  duration?: number;
}

export const Ticker: React.FC<TickerProps> = ({ items, duration = 40 }) => {
  if (!items || items.length === 0) {
    return null;
  }

  const tickerVariants: Variants = {
    animate: {
      x: ['0%', '-100%'],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: 'loop',
          duration: duration,
          ease: 'linear',
        },
      },
    },
  };

  return (
    <div className="w-full overflow-hidden bg-background border-y border-border/50 relative">
      <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-background to-transparent z-10"></div>
      <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-background to-transparent z-10"></div>
      <motion.div
        className="flex"
        variants={tickerVariants}
        animate="animate"
      >
        {[...items, ...items].map((item, index) => (
          <div key={`${item.id}-${index}`} className="flex-shrink-0 flex items-center space-x-2 px-4 py-2 whitespace-nowrap">
            <span className="text-sm text-muted-foreground">{item.title}:</span>
            <span className="text-sm font-semibold text-foreground">{item.value}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
