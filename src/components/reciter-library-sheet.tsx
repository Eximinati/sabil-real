'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { reciters } from '@/data/reciters';

interface ReciterLibrarySheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentReciterId: number;
  onSelect: (id: number) => void;
  copy: {
    reciterLibrary: string;
    searchPlaceholder: string;
    currentReciter: string;
    recentlyUsed: string;
    recommended: string;
    allReciters: string;
    noResults: string;
  };
}

const RECENT_KEY = 'sabil-recent-reciters';

function getRecentIds(): number[] {
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(Number).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function ReciterLibrarySheet({
  isOpen,
  onClose,
  currentReciterId,
  onSelect,
  copy,
}: ReciterLibrarySheetProps) {
  const [search, setSearch] = useState('');
  const [closing, setClosing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setSearch('');
      setTimeout(() => searchRef.current?.focus(), 350);
    }
  }, [isOpen]);

  const recentIds = useMemo(() => {
    if (!isOpen) return [];
    return getRecentIds();
  }, [isOpen]);

  const recentlyUsedReciters = useMemo(
    () =>
      recentIds
        .map((id) => reciters.find((r) => r.id === id))
        .filter((r): r is (typeof reciters)[0] => !!r),
    [recentIds]
  );

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setSearch('');
      onClose();
    }, 250);
  }, [onClose]);

  const handleSelect = useCallback(
    (r: (typeof reciters)[0]) => {
      handleClose();
      setTimeout(() => onSelect(r.id), 250);
    },
    [handleClose, onSelect]
  );

  const currentReciter = reciters.find((r) => r.id === currentReciterId);

  const filteredReciters = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return reciters;
    return reciters.filter((r) => r.name.toLowerCase().includes(needle));
  }, [search]);

  if (!isOpen && !closing) return null;

  return (
    <>
      <button
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:bg-black/30"
        onClick={handleClose}
        aria-label="Close"
      />

      <div
        className={`fixed z-50 bg-[var(--color-surface)] border-[var(--color-border)] shadow-2xl ${
          closing ? '' : 'animate-slide-up'
        } md:bottom-0 md:right-0 md:top-0 md:w-[420px] md:max-w-[90vw] md:border-l md:animate-slide-in-right md:rounded-none bottom-0 left-0 right-0 max-h-[90vh] rounded-t-[28px] border-t`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              {copy.reciterLibrary}
            </h2>
            <button
              onClick={handleClose}
              className="rounded-full p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-5 py-3">
            <input
              ref={searchRef}
              type="text"
              placeholder={copy.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
            {search.trim() ? (
              <div className="space-y-1 pt-2">
                {filteredReciters.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                      r.id === currentReciterId
                        ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                        : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                    }`}
                  >
                    <span className="text-sm font-medium">{r.name}</span>
                    {r.id === currentReciterId && (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
                {filteredReciters.length === 0 && (
                  <p className="px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
                    {copy.noResults}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-6 pt-2">
                {currentReciter && (
                  <div>
                    <div className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                      {copy.currentReciter}
                    </div>
                    <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 px-4 py-3">
                      <p className="text-sm font-medium text-[var(--color-text)]">
                        {currentReciter.name}
                      </p>
                    </div>
                  </div>
                )}

                {recentlyUsedReciters.length > 0 && (
                  <div>
                    <div className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                      {copy.recentlyUsed}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentlyUsedReciters.map((r) => (
                        <button
                          key={`recent-${r.id}`}
                          onClick={() => handleSelect(r)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                            r.id === currentReciterId
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                              : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)]/40'
                          }`}
                        >
                          {r.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    {copy.recommended}
                  </div>
                  <div className="space-y-1">
                    {reciters.map((r) => (
                      <button
                        key={`all-${r.id}`}
                        onClick={() => handleSelect(r)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                          r.id === currentReciterId
                            ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                            : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                        }`}
                      >
                        <span className="text-sm font-medium">{r.name}</span>
                        {r.id === currentReciterId && (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
