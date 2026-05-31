'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { getRecentTafsirIds, addRecentTafsirId } from '@/lib/tafsir-preferences';
import type { TafsirLanguagePreference } from '@/lib/tafsir-preferences';

interface Tafsir {
  id: number;
  name: string;
  author_name: string | null;
  language_name: string;
}

interface TafsirLibrarySheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentTafsirId: number;
  onSelect: (id: number) => void;
  preferredLanguage: TafsirLanguagePreference;
  onLanguageChange: (lang: TafsirLanguagePreference) => void;
  copy: {
    tafsirLibrary: string;
    searchPlaceholder: string;
    currentScholar: string;
    recentlyUsed: string;
    recommended: string;
    allScholars: string;
    languageFilter: string;
    auto: string;
    english: string;
    urdu: string;
    arabic: string;
    noResults: string;
  };
}

export function TafsirLibrarySheet({
  isOpen,
  onClose,
  currentTafsirId,
  onSelect,
  preferredLanguage,
  onLanguageChange,
  copy,
}: TafsirLibrarySheetProps) {
  const [search, setSearch] = useState('');
  const [closing, setClosing] = useState(false);
  const [tafsirs, setTafsirs] = useState<Tafsir[]>([]);
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  const languageOptions = [
    { value: 'auto' as TafsirLanguagePreference, label: copy.auto },
    { value: 'en' as TafsirLanguagePreference, label: copy.english },
    { value: 'ur' as TafsirLanguagePreference, label: copy.urdu },
    { value: 'ar' as TafsirLanguagePreference, label: copy.arabic },
  ];

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;

    fetch('/api/tafsirs')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        const list = data.tafsirs || data || [];
        setTafsirs(Array.isArray(list) ? list : []);
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
    return getRecentTafsirIds();
  }, [isOpen]);

  const recentlyUsedTafsirs = useMemo(
    () =>
      recentIds
        .map((id) => tafsirs.find((t) => t.id === id))
        .filter((t): t is Tafsir => !!t),
    [recentIds, tafsirs]
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
    (t: Tafsir) => {
      addRecentTafsirId(t.id);
      handleClose();
      setTimeout(() => onSelect(t.id), 250);
    },
    [handleClose, onSelect]
  );

  const currentTafsir = tafsirs.find((t) => t.id === currentTafsirId);

  const filteredTafsirs = useMemo(() => {
    const needle = search.trim().toLowerCase();
    let filtered = tafsirs;

    if (needle) {
      filtered = tafsirs.filter((t) => {
        const author = (t.author_name || '').toLowerCase();
        const lang = (t.language_name || '').toLowerCase();
        const name = (t.name || '').toLowerCase();
        return author.includes(needle) || lang.includes(needle) || name.includes(needle);
      });
    }

    if (preferredLanguage !== 'auto') {
      filtered = filtered.filter(
        (t) => (t.language_name || '').toLowerCase() === preferredLanguage
      );
    }

    return filtered;
  }, [search, tafsirs, preferredLanguage]);

  const recommendedTafsirs = useMemo(() => {
    return [...tafsirs]
      .filter((t) => {
        const lang = (t.language_name || '').toLowerCase();
        if (preferredLanguage === 'auto') {
          return lang === 'english' || lang === 'urdu';
        }
        return lang === preferredLanguage;
      })
      .slice(0, 5);
  }, [tafsirs, preferredLanguage]);

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
              {copy.tafsirLibrary}
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

          <div className="px-5 py-3 space-y-3">
            <input
              ref={searchRef}
              type="text"
              placeholder={copy.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
            />

            <div className="flex gap-1.5">
              {languageOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onLanguageChange(value)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                    preferredLanguage === value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
            {loading ? (
              <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
                Loading...
              </div>
            ) : search.trim() || preferredLanguage !== 'auto' ? (
              <div className="space-y-1 pt-2">
                {filteredTafsirs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(t)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                      t.id === currentTafsirId
                        ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                        : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                    }`}
                  >
                    <span className="text-sm font-medium">{t.author_name || t.name}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">{t.language_name}</span>
                  </button>
                ))}
                {filteredTafsirs.length === 0 && (
                  <p className="px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
                    {copy.noResults}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-6 pt-2">
                {currentTafsir && (
                  <div>
                    <div className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                      {copy.currentScholar}
                    </div>
                    <div className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-4 py-3">
                      <p className="text-sm font-medium text-[var(--color-text)]">
                        {currentTafsir.author_name || currentTafsir.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {currentTafsir.language_name}
                      </p>
                    </div>
                  </div>
                )}

                {recentlyUsedTafsirs.length > 0 && (
                  <div>
                    <div className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                      {copy.recentlyUsed}
                    </div>
                    <div className="space-y-1">
                      {recentlyUsedTafsirs.map((t) => (
                        <button
                          key={`recent-${t.id}`}
                          onClick={() => handleSelect(t)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                            t.id === currentTafsirId
                              ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                              : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                          }`}
                        >
                          <span className="text-sm font-medium">{t.author_name || t.name}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">{t.language_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {recommendedTafsirs.length > 0 && (
                  <div>
                    <div className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                      {copy.recommended}
                    </div>
                    <div className="space-y-1">
                      {recommendedTafsirs.map((t) => (
                        <button
                          key={`rec-${t.id}`}
                          onClick={() => handleSelect(t)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                            t.id === currentTafsirId
                              ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                              : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                          }`}
                        >
                          <span className="text-sm font-medium">{t.author_name || t.name}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">{t.language_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    {copy.allScholars}
                  </div>
                  <div className="space-y-1">
                    {tafsirs
                      .filter((t) => t.id !== currentTafsirId)
                      .filter((t) => !recentlyUsedTafsirs.some((r) => r.id === t.id))
                      .filter((t) => !recommendedTafsirs.some((r) => r.id === t.id))
                      .map((t) => (
                        <button
                          key={`all-${t.id}`}
                          onClick={() => handleSelect(t)}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)]"
                        >
                          <span className="text-sm font-medium">{t.author_name || t.name}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">{t.language_name}</span>
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
