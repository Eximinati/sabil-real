'use client';

import * as React from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

export interface ToastItem extends Toast {
  onDismiss: () => void;
}

interface ToastProps {
  toast: ToastItem;
}

const variantStyles = {
  success: {
    container: 'border-[var(--color-success)]/30',
    icon: 'text-[var(--color-success)]',
    bg: 'bg-[var(--color-success)]/8',
  },
  error: {
    container: 'border-[var(--color-error)]/30',
    icon: 'text-[var(--color-error)]',
    bg: 'bg-[var(--color-error)]/8',
  },
  info: {
    container: 'border-[var(--color-text-subtle)]/30',
    icon: 'text-[var(--color-text-muted)]',
    bg: 'bg-[var(--color-text-subtle)]/8',
  },
};

const variantIcons = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export function Toast({ toast }: ToastProps) {
  const styles = variantStyles[toast.variant];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-center gap-3 px-4 py-3 
        bg-[var(--color-surface)] 
        border ${styles.container}
        rounded-xl shadow-[var(--shadow-md)]
        max-w-[360px] w-full
        animate-toast-in
        ${styles.bg}
      `}
    >
      <span className={styles.icon}>{variantIcons[toast.variant]}</span>
      <p className="text-[var(--color-text)] text-sm flex-1">{toast.message}</p>
      <button
        onClick={toast.onDismiss}
        aria-label="Dismiss"
        className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors p-1 -m-1 rounded-lg hover:bg-[var(--color-border)]/50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}