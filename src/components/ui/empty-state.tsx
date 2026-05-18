import Link from 'next/link';

interface EmptyStateProps {
  icon?: 'reflection' | 'bookmark' | 'search' | 'hadith' | 'tafsir' | 'audio' | 'journey' | 'journey-empty';
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

const icons = {
  reflection: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  bookmark: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  ),
  search: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  hadith: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  tafsir: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  audio: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  ),
  journey: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  'journey-empty': (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export function EmptyState({ icon, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center" role="status">
      {icon && (
        <div className="w-20 h-20 mb-6 rounded-full bg-[var(--color-border)]/50 flex items-center justify-center text-[var(--color-text-muted)]">
          {icons[icon]}
        </div>
      )}
      
      <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-[var(--color-text-muted)] max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {(actionLabel && actionHref) && (
        <Link
          href={actionHref}
          className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-full hover:opacity-90 transition-opacity text-sm font-medium"
        >
          {actionLabel}
        </Link>
      )}
      
      {(actionLabel && onAction) && (
        <button
          onClick={onAction}
          className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-full hover:opacity-90 transition-opacity text-sm font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-4 py-8" aria-label="Loading content">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-[var(--color-border)]/50 rounded w-3/4" />
          <div className="h-3 bg-[var(--color-border)]/30 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 animate-pulse" role="status" aria-label="Loading">
      <div className="flex items-start justify-between mb-4">
        <div className="w-8 h-8 bg-[var(--color-accent)]/20 rounded-full" />
        <div className="w-8 h-8 bg-[var(--color-border)]/50 rounded" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-6 bg-[var(--color-border)]/50 rounded w-full" />
        <div className="h-4 bg-[var(--color-border)]/30 rounded w-3/4" />
      </div>
      <div className="border-t border-[var(--color-border)]/50 pt-4 space-y-2">
        <div className="h-3 bg-[var(--color-border)]/30 rounded w-1/4" />
        <div className="h-4 bg-[var(--color-border)]/30 rounded w-full" />
      </div>
    </div>
  );
}

export function AudioUnavailable() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-14 h-14 mb-4 rounded-full bg-[var(--color-border)]/50 flex items-center justify-center text-[var(--color-text-muted)]">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      </div>
      <p className="text-sm text-[var(--color-text-muted)]">Audio not available for this recitation.</p>
    </div>
  );
}