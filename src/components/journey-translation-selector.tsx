'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';

interface Translation {
  id: number;
  name: string;
  author_name: string;
  language_name: string;
}

interface JourneyTranslationSelectorProps {
  currentTranslationId: number;
  onTranslationChange?: (id: number) => void;
  variant?: 'header' | 'lesson' | 'inline';
  onOpenLibrary?: () => void;
}

const STORAGE_KEY = 'sabil-translation-id';
const RECENT_KEY = 'sabil-recent-translations';
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

export function JourneyTranslationSelector({
  currentTranslationId,
  onTranslationChange,
  variant = 'lesson',
  onOpenLibrary,
}: JourneyTranslationSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTranslation, setCurrentTranslation] = useState<Translation | null>(null);
  const [recentTranslations, setRecentTranslations] = useState<Translation[]>([]);

  useEffect(() => {
    let mounted = true;

    fetch('/api/translations')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data : data.translations || [];
        setTranslations(list);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const next = translations.find((t) => t.id === currentTranslationId) || null;
    setCurrentTranslation(next);
  }, [currentTranslationId, translations]);

  useEffect(() => {
    const recentIds = getRecentIds();
    const recent = recentIds
      .map((id) => translations.find((t) => t.id === id))
      .filter((t): t is Translation => !!t);
    setRecentTranslations(recent);
  }, [translations, currentTranslationId]);

  const handleSelect = useCallback(
    (selected: Translation) => {
      setCurrentTranslation(selected);
      setIsOpen(false);
      localStorage.setItem(STORAGE_KEY, selected.id.toString());
      addRecentId(selected.id);

      if (onTranslationChange) {
        onTranslationChange(selected.id);
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set('translation', selected.id.toString());
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [onTranslationChange, pathname, router, searchParams]
  );

  const isUrdu = language === 'ur';
  const copy = useMemo(
    () => ({
      buttonFallback: isUrdu ? 'ترجمہ' : 'Translation',
      changeTranslation: isUrdu ? 'ترجمہ تبدیل کریں' : 'Change translation',
      closePicker: isUrdu ? 'ترجمہ فہرست بند کریں' : 'Close translation picker',
      quranTranslation: isUrdu ? 'قرآن ترجمہ' : 'Quran Translation',
      recentlyUsed: isUrdu ? 'حالیہ استعمال شدہ' : 'Recently Used',
      selectTranslation: isUrdu ? 'ترجمہ منتخب کریں ←' : 'Select Translation →',
      browseAll: isUrdu ? 'تمام تراجم دیکھیں' : 'Browse All Translations',
      loading: isUrdu ? 'لوڈ ہو رہا ہے...' : 'Loading...',
      close: isUrdu ? 'بند کریں' : 'Close',
    }),
    [isUrdu]
  );

  const buttonLabel = currentTranslation?.author_name || copy.buttonFallback;
  const nonCurrentRecent = recentTranslations.filter((t) => t.id !== currentTranslationId);

  if (variant === 'inline') {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/55 px-4 py-3">
          <p className="text-xs text-[var(--color-text-muted)]">{copy.quranTranslation}</p>
          <p className="mt-0.5 text-sm font-medium text-[var(--color-text)]">
            {currentTranslation?.author_name || copy.buttonFallback}
          </p>
          {currentTranslation?.language_name && (
            <p className="text-xs text-[var(--color-text-muted)]">
              {currentTranslation.language_name}
            </p>
          )}
        </div>

        {nonCurrentRecent.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              {copy.recentlyUsed}
            </p>
            <div className="flex flex-wrap gap-2">
              {nonCurrentRecent.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t)}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-bg)]"
                >
                  {t.author_name}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onOpenLibrary}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/5"
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
        className={`quiet-controls flex items-center gap-2 text-sm rounded-full border transition-all ${
          variant === 'header'
            ? 'px-3 py-1.5 border-[var(--color-border)] bg-[var(--color-bg)]/80 hover:border-[var(--color-primary)]/40 text-[var(--color-text-secondary)]'
            : 'px-3 py-1.5 border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/40 text-[var(--color-text-secondary)]'
        }`}
        aria-label={copy.changeTranslation}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span className="max-w-[170px] truncate">{buttonLabel}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-12 md:pt-20">
          <button
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-label={copy.closePicker}
          />

          <div className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
            <div className="border-b border-[var(--color-border)] p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  {copy.quranTranslation}
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

              {loading ? (
                <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                  {copy.loading}
                </div>
              ) : (
                <div className="mt-3">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/55 px-4 py-3">
                    <p className="text-xs text-[var(--color-text-muted)]">{copy.quranTranslation}</p>
                    <p className="mt-0.5 text-sm font-medium text-[var(--color-text)]">
                      {currentTranslation?.author_name || copy.buttonFallback}
                    </p>
                    {currentTranslation?.language_name && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {currentTranslation.language_name}
                      </p>
                    )}
                  </div>

                  {nonCurrentRecent.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                        {copy.recentlyUsed}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {nonCurrentRecent.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleSelect(t)}
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-bg)]"
                          >
                            {t.author_name}
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
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/5"
                    >
                      <span className="font-medium">{copy.selectTranslation}</span>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
