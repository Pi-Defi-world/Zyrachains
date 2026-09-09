'use client';

import { useToast as useToastContext } from '@/components/context/ToastContext';
import { ToastType } from '@/components/context/ToastContext';

/**
 * Hook for showing toast notifications
 * @returns Object with methods to show different toast types
 */
export function useToastNotification() {
  const { showToast } = useToastContext();

  return {
    success: (message: string, duration?: number) => showToast(message, 'success', duration),
    error: (message: string, duration?: number) => showToast(message, 'error', duration),
    warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
    info: (message: string, duration?: number) => showToast(message, 'info', duration),
    show: (message: string, type: ToastType, duration?: number) => showToast(message, type, duration),
  };
}
