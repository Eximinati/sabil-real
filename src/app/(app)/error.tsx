'use client';

import { useMemo } from 'react';
import { getSystemCopyFromClient } from '@/lib/i18n/system-copy';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const copy = useMemo(() => getSystemCopyFromClient().globalError, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-bg)]">
      <div className="max-w-md w-full text-center p-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--color-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-xl font-medium text-[var(--color-text)] mb-2">
          {copy.title}
        </h1>
        
        <p className="text-[var(--color-text-muted)] text-sm mb-6">
          {copy.description}
        </p>
        
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-full hover:opacity-90 transition-opacity font-medium text-sm"
        >
          {copy.retry}
        </button>
        
        <p className="text-xs text-[var(--color-text-subtle)] mt-6" dir="rtl">
          {copy.verse}
        </p>
      </div>
    </div>
  );
}
