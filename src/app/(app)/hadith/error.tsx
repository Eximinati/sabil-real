'use client';

import { useMemo } from 'react';
import { getSystemCopyFromClient } from '@/lib/i18n/system-copy';

export default function HadithErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const copy = useMemo(() => getSystemCopyFromClient().hadithError, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-bg)] md:ml-[240px]">
      <div className="max-w-md w-full text-center p-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--color-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
      </div>
    </div>
  );
}
