'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCopy } from '@/hooks/use-copy';
import { FocusTrap } from './focus-trap';

export function FloatingNotice() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const copy = useCopy();
  const noticeContent = copy.buildNotice.body;

  const isImmersiveRoute = pathname?.startsWith('/journey') || /^\/quran\/\d+/.test(pathname || '');

  if (isImmersiveRoute) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/92 px-4 py-2.5 text-[var(--color-text-muted)] shadow-md backdrop-blur-sm transition-all hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)]"
        aria-label={copy.buildNotice.triggerTitle}
        title={copy.buildNotice.triggerTitle}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-medium hidden sm:inline">{copy.buildNotice.triggerLabel}</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setIsOpen(false); }}
        >
          <FocusTrap active={isOpen}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="build-notice-title"
            className="bg-[var(--color-surface)] rounded-2xl max-w-lg w-full overflow-hidden border border-[var(--color-border)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[var(--color-border)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 id="build-notice-title" className="text-[var(--color-text)] font-semibold">{copy.buildNotice.modalTitle}</h2>
                <p className="text-[var(--color-text-muted)] text-sm">{copy.buildNotice.modalSubtitle}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="ml-auto p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] rounded-lg transition-colors"
                aria-label={copy.common.labels.close}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="text-[var(--color-text)] leading-relaxed space-y-3">
                {noticeContent.split('\n').map((line, i) => {
                  if (line.startsWith('-')) {
                    return <p key={i} className="text-[var(--color-text-secondary)] pl-4">- {line.slice(1).trim()}</p>;
                  }
                  if (line.endsWith(':')) {
                    return <p key={i} className="text-[var(--color-text)] font-medium mt-4">{line}</p>;
                  }
                  if (line.trim() === '') {
                    return <div key={i} className="h-2" />;
                  }
                  return <p key={i} className="text-[var(--color-text-secondary)]">{line}</p>;
                })}
              </div>
            </div>
            <div className="p-4 border-t border-[var(--color-border)] flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors text-sm font-medium"
              >
                {copy.buildNotice.acknowledge}
              </button>
            </div>
          </div>
          </FocusTrap>
        </div>
      )}
    </>
  );
}
