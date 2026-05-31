'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n/context';

interface Reciter {
  id: number;
  name: string;
}

interface JourneyReciterSelectorProps {
  currentReciterId: number;
  onReciterChange: (id: number) => void;
  variant?: 'header' | 'lesson' | 'inline';
  onOpenLibrary?: () => void;
}

const reciters: Reciter[] = [
  { id: 5, name: 'Mishary Rashid Alafasy' },
  { id: 7, name: 'Abdul Basit' },
  { id: 10, name: 'Mohamed Siddiq El-Minshawi' },
  { id: 11, name: 'Abdurrahman As-Sudais' },
  { id: 16, name: 'Mahmoud Khalil Al-Husary' },
];

const RECENT_KEY = 'sabil-recent-reciters';
const MAX_RECENT = 5;

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

function addRecentId(id: number) {
  try {
    const ids = getRecentIds().filter((i) => i !== id);
    ids.unshift(id);
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, MAX_RECENT)));
  } catch {
  }
}

export function JourneyReciterSelector({
  currentReciterId,
  onReciterChange,
  variant = 'lesson',
  onOpenLibrary,
}: JourneyReciterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  const copy = useMemo(
    () => ({
      changeReciter: isUrdu ? 'قاری تبدیل کریں' : 'Change reciter',
      reciterShort: isUrdu ? 'قاری' : 'Reciter',
      title: isUrdu ? 'قاری منتخب کریں' : 'Choose a reciter',
      subtitle: isUrdu ? 'آڈیو اختیاری ہے۔ صرف وہ آواز رکھیں جو دل کو حاضر رکھے۔' : 'Audio is optional. Keep only the voice that helps you stay present.',
      close: isUrdu ? 'بند کریں' : 'Close',
      quranReciter: isUrdu ? 'قرآن قاری' : 'Quran Reciter',
      recentlyUsed: isUrdu ? 'حالیہ استعمال شدہ' : 'Recently Used',
      browseAll: isUrdu ? 'تمام قاری دیکھیں' : 'Browse All Reciters',
      selectReciter: isUrdu ? 'قاری منتخب کریں ←' : 'Select Reciter →',
    }),
    [isUrdu]
  );

  const currentReciter = reciters.find((r) => r.id === currentReciterId) || reciters[0];
  const displayName = currentReciter.name.length > 22
    ? currentReciter.name.slice(0, 22) + '...'
    : currentReciter.name;

  const recentReciters = useMemo(
    () =>
      getRecentIds()
        .map((id) => reciters.find((r) => r.id === id))
        .filter((r): r is Reciter => !!r)
        .filter((r) => r.id !== currentReciterId),
    [currentReciterId]
  );

  const handleSelect = useCallback(
    (id: number) => {
      addRecentId(id);
      onReciterChange(id);
      setIsOpen(false);
    },
    [onReciterChange]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  if (variant === 'inline') {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/55 px-4 py-3">
          <p className="text-xs text-[var(--color-text-muted)]">{copy.quranReciter}</p>
          <p className="mt-0.5 text-sm font-medium text-[var(--color-text)]">
            {currentReciter.name}
          </p>
        </div>

        {recentReciters.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              {copy.recentlyUsed}
            </p>
            <div className="flex flex-wrap gap-2">
              {recentReciters.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelect(r.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-bg)]"
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onOpenLibrary}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/5"
        >
          <span className="font-medium">{copy.browseAll}</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`quiet-controls flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-accent)]/40 ${
          variant === 'header' ? 'bg-[var(--color-bg)]/80' : ''
        }`}
        aria-label={copy.changeReciter}
      >
        <svg className="w-3.5 h-3.5 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <span className="hidden max-w-[110px] truncate sm:inline">{displayName}</span>
        <span className="sm:hidden">{copy.reciterShort}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-12 md:pt-20">
          <button
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-label={copy.close}
          />

          <div className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
            <div className="border-b border-[var(--color-border)] p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  {copy.title}
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50"
                  aria-label={copy.close}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-3">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/55 px-4 py-3">
                  <p className="text-xs text-[var(--color-text-muted)]">{copy.quranReciter}</p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--color-text)]">
                    {currentReciter.name}
                  </p>
                </div>

                {recentReciters.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                      {copy.recentlyUsed}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recentReciters.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => handleSelect(r.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-bg)]"
                        >
                          {r.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 border-t border-[var(--color-border)] pt-3">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenLibrary?.();
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/5"
                  >
                    <span className="font-medium">{copy.selectReciter}</span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
