'use client';

import React from 'react';
import { initiatePiSignIn } from '@/lib/pi-signin';

interface PiSignInButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onSuccess?: () => void;
}

export default function PiSignInButton({ className = '', variant = 'primary', size = 'md' }: PiSignInButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all cursor-pointer';
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  };
  const variantClasses = {
    primary: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-yellow-950 hover:from-yellow-400 hover:to-amber-400 shadow-lg shadow-yellow-500/25',
    secondary: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20',
    outline: 'border-2 border-yellow-500/40 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10',
  };

  return (
    <button
      onClick={initiatePiSignIn}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/>
      </svg>
      Sign in with Pi
    </button>
  );
}
