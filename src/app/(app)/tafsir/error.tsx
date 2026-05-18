'use client';

export default function TafsirErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-bg)] md:ml-[240px]">
      <div className="max-w-md w-full text-center p-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--color-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        
        <h1 className="text-xl font-medium text-[var(--color-text)] mb-2">
          Couldn&apos;t load Tafsir
        </h1>
        
        <p className="text-[var(--color-text-muted)] text-sm mb-6">
          The explanation could not be retrieved. Please try again.
        </p>
        
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-full hover:opacity-90 transition-opacity font-medium text-sm"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}