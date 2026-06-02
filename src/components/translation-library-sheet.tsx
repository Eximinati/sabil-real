'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { FocusTrap } from './focus-trap';
import { useCopy } from '@/hooks/use-copy';

interface Translation {
  id: number;
  name: string;
  author_name: string;
  language_name: string;
}

interface TranslationLibrarySheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentTranslationId: number;
  onSelect: (id: number) => void;
  preferredLanguage: 'english' | 'urdu';
  copy: {
    translationLibrary: string;
    searchPlaceholder: string;
    recentlyUsed: string;
    recommended: string;
    urduSection: string;
    englishSection: string;
    otherLanguages: string;
    noResults: string;
  };
}

const RECENT_KEY = 'sabil-recent-translations';

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

function getLanguageRank(languageName: string, preferredLanguage: 'english' | 'urdu') {
  const normalized = (languageName || '').toLowerCase();
  if (normalized === preferredLanguage) return 0;
  if (normalized === 'arabic') return 1;
  if (normalized === 'english' || normalized === 'urdu') return 2;
  return 3;
}

export function TranslationLibrarySheet({
  isOpen,
  onClose,
  currentTranslationId,
  onSelect,
  preferredLanguage,
  copy,
}: TranslationLibrarySheetProps) {
  const [search, setSearch] = useState('');
  const [closing, setClosing] = useState(false);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);
  const globalCopy = useCopy();

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setSearch('');
      setLoading(true);
      setTimeout(() => searchRef.current?.focus(), 350);
    }
  }, [isOpen]);

  const recentIds = useMemo(() => {
    if (!isOpen) return [];
    return getRecentIds();
  }, [isOpen]);

  const recentlyUsedTranslations = useMemo(
    () =>
      recentIds
        .map((id) => translations.find((t) => t.id === id))
        .filter((t): t is Translation => !!t),
    [recentIds, translations]
  );

  const recentlyUsedIds = useMemo(
    () => new Set(recentlyUsedTranslations.map((t) => t.id)),
    [recentlyUsedTranslations]
  );

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setSearch('');
      onClose();
    }, 250);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  const handleSelect = useCallback(
    (t: Translation) => {
      handleClose();
      setTimeout(() => onSelect(t.id), 250);
    },
    [handleClose, onSelect]
  );

  const recommendedTranslations = useMemo(() => {
    return [...translations]
      .filter((t) => !recentlyUsedIds.has(t.id) && t.id !== currentTranslationId)
      .sort((a, b) => {
        const rankA = getLanguageRank(a.language_name, preferredLanguage);
        const rankB = getLanguageRank(b.language_name, preferredLanguage);
        if (rankA !== rankB) return rankA - rankB;
        return (a.author_name || '').localeCompare(b.author_name || '');
      })
      .slice(0, 4);
  }, [translations, recentlyUsedIds, currentTranslationId, preferredLanguage]);

  const recommendedIds = useMemo(
    () => new Set(recommendedTranslations.map((t) => t.id)),
    [recommendedTranslations]
  );

  const filteredTranslations = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      const urdu = translations
        .filter((t) => t.language_name?.toLowerCase() === 'urdu')
        .filter((t) => !recentlyUsedIds.has(t.id) && !recommendedIds.has(t.id));

      const english = translations
        .filter((t) => t.language_name?.toLowerCase() === 'english')
        .filter((t) => !recentlyUsedIds.has(t.id) && !recommendedIds.has(t.id));

      const other = translations
        .filter((t) => {
          const lang = t.language_name?.toLowerCase();
          return lang !== 'urdu' && lang !== 'english';
        })
        .filter((t) => !recentlyUsedIds.has(t.id) && !recommendedIds.has(t.id))
        .sort((a, b) => (a.language_name || '').localeCompare(b.language_name || ''));

      return { urdu, english, other, isSearching: false as const };
    }

    const filtered = translations.filter((t) => {
      const author = (t.author_name || '').toLowerCase();
      const lang = (t.language_name || '').toLowerCase();
      const name = (t.name || '').toLowerCase();
      return author.includes(needle) || lang.includes(needle) || name.includes(needle);
    });

    return { all: filtered, isSearching: true as const };
  }, [search, translations, recentlyUsedIds, recommendedIds]);

  if (!isOpen && !closing) return null;

  return (
    <>
      <button
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:bg-black/30"
        onClick={handleClose}
        aria-label={globalCopy.common.labels.close}
      />

      <FocusTrap active={isOpen && !closing}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="translation-library-title"
        className={`fixed z-50 bg-[var(--color-surface)] border-[var(--color-border)] shadow-2xl ${
          closing ? '' : 'animate-slide-up'
        } safe-area-bottom md:bottom-0 md:right-0 md:top-0 md:w-[420px] md:max-w-[90vw] md:border-l md:animate-slide-in-right md:rounded-none bottom-0 left-0 right-0 max-h-[90vh] rounded-t-[28px] border-t`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <h2 id="translation-library-title" className="text-lg font-semibold text-[var(--color-text)]">
              {copy.translationLibrary}
            </h2>
            <button
              onClick={handleClose}
              className="rounded-full p-3 text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50"
              aria-label={globalCopy.common.labels.close}
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
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          <div aria-live="polite" aria-atomic="true" className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
            {loading ? (
              <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
                Loading...
              </div>
            ) : filteredTranslations.isSearching ? (
              <div className="space-y-1 pt-2">
                {filteredTranslations.all.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(t)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                      t.id === currentTranslationId
                        ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                        : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                    }`}
                  >
                    <span className="text-sm font-medium">{t.author_name}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">{t.language_name}</span>
                  </button>
                ))}
                {filteredTranslations.all.length === 0 && (
                  <p className="px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
                    {copy.noResults}
                  </p>
                )}
              </div>
            ) : (
              <div className="pt-2 space-y-6">
                {recentlyUsedTranslations.length > 0 && (
                  <div>
                    <div className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                      {copy.recentlyUsed}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentlyUsedTranslations.map((t) => (
                        <button
                          key={`recent-${t.id}`}
                          onClick={() => handleSelect(t)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                            t.id === currentTranslationId
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                              : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)]/40'
                          }`}
                        >
                          {t.author_name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {recommendedTranslations.length > 0 && (
                  <div>
                    <div className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                      {copy.recommended}
                    </div>
                    <div className="space-y-1">
                      {recommendedTranslations.map((t) => (
                        <button
                          key={`rec-${t.id}`}
                          onClick={() => handleSelect(t)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                            t.id === currentTranslationId
                              ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                              : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                          }`}
                        >
                          <span className="text-sm font-medium">{t.author_name}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">{t.language_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {filteredTranslations.urdu.length > 0 && (
                  <div>
                    <div className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                      {copy.urduSection}
                    </div>
                    <div className="space-y-1">
                      {filteredTranslations.urdu.map((t) => (
                        <button
                          key={`ur-${t.id}`}
                          onClick={() => handleSelect(t)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                            t.id === currentTranslationId
                              ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                              : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                          }`}
                        >
                          <span className="text-sm font-medium">{t.author_name}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">{t.language_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {filteredTranslations.english.length > 0 && (
                  <div>
                    <div className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                      {copy.englishSection}
                    </div>
                    <div className="space-y-1">
                      {filteredTranslations.english.map((t) => (
                        <button
                          key={`en-${t.id}`}
                          onClick={() => handleSelect(t)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                            t.id === currentTranslationId
                              ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                              : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                          }`}
                        >
                          <span className="text-sm font-medium">{t.author_name}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">{t.language_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {filteredTranslations.other.length > 0 && (
                  <div>
                    <div className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                      {copy.otherLanguages}
                    </div>
                    <div className="space-y-1">
                      {filteredTranslations.other.map((t) => (
                        <button
                          key={`other-${t.id}`}
                          onClick={() => handleSelect(t)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                            t.id === currentTranslationId
                              ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                              : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                          }`}
                        >
                          <span className="text-sm font-medium">{t.author_name}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">{t.language_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {recentlyUsedTranslations.length === 0 &&
                  recommendedTranslations.length === 0 &&
                  filteredTranslations.urdu.length === 0 &&
                  filteredTranslations.english.length === 0 &&
                  filteredTranslations.other.length === 0 && (
                    <p className="px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
                      {copy.noResults}
                    </p>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
      </FocusTrap>
    </>
  );
}
