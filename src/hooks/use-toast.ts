'use client';

import { useToastContext } from '@/components/ui/toast-provider';
import type { ToastVariant } from '@/components/ui/toast';

export function useToast() {
  const { addToast } = useToastContext();

  return {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info'),
    toast: (message: string, variant?: ToastVariant) => addToast(message, variant || 'info'),
  };
}