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
  variant?: 'header' | 'lesson';
}

const STORAGE_KEY = 'sabil-translation-id';

function getLanguageRank(languageName: string, preferredLanguage: 'english' | 'urdu') {
  const normalized = (languageName || '').toLowerCase();
  if (normalized === preferredLanguage) return 0;
  if (normalized === 'arabic') return 1;
  if (normalized === 'english' || normalized === 'urdu') return 2;
  return 3;
}

export function JourneyTranslationSelector({
  currentTranslationId,
  onTranslationChange,
  variant = 'lesson',
}: JourneyTranslationSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTranslation, setCurrentTranslation] = useState<Translation | null>(null);

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
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const next = translations.find((t) => t.id === currentTranslationId) || null;
    setCurrentTranslation(next);
  }, [currentTranslationId, translations]);

  const preferredLanguage = language === 'ur' ? 'urdu' : 'english';
  const isUrdu = language === 'ur';
  const copy = isUrdu
    ? {
        buttonFallback: 'ترجمہ',
        buttonCollapsed: 'ترجمہ',
        changeTranslation: 'ترجمہ تبدیل کریں',
        closePicker: 'ترجمہ فہرست بند کریں',
        chooseTitle: 'ترجمہ منتخب کریں',
        chooseSubtitle: 'ایک بار منتخب کریں، پھر توجہ پڑھنے پر رکھیں۔',
        close: 'بند کریں',
        current: 'موجودہ',
        loading: 'لوڈ ہو رہا ہے...',
        recommended: 'تجویز کردہ',
        moreTranslations: 'مزید تراجم',
        hide: 'چھپائیں',
        show: 'دکھائیں',
        searchPlaceholder: 'زبان یا مترجم تلاش کریں',
        noneFound: 'کوئی ترجمہ نہیں ملا۔',
      }
    : {
        buttonFallback: 'Translation',
        buttonCollapsed: 'Translation',
        changeTranslation: 'Change translation',
        closePicker: 'Close translation picker',
        chooseTitle: 'Choose translation',
        chooseSubtitle: 'Set once, then keep reading central.',
        close: 'Close',
        current: 'Current',
        loading: 'Loading...',
        recommended: 'Recommended',
        moreTranslations: 'More translations',
        hide: 'Hide',
        show: 'Show',
        searchPlaceholder: 'Search language or translator',
        noneFound: 'No translations found.',
      };

  const recommendedTranslations = useMemo(() => {
    return [...translations]
      .sort((a, b) => {
        const rankA = getLanguageRank(a.language_name, preferredLanguage);
        const rankB = getLanguageRank(b.language_name, preferredLanguage);

        if (rankA !== rankB) {
          return rankA - rankB;
        }

        return (a.author_name || '').localeCompare(b.author_name || '');
      })
      .slice(0, 6);
  }, [preferredLanguage, translations]);

  const filteredAllTranslations = useMemo(() => {
    const sorted = [...translations].sort((a, b) => {
      const lang = (a.language_name || '').localeCompare(b.language_name || '');
      if (lang !== 0) {
        return lang;
      }

      return (a.author_name || '').localeCompare(b.author_name || '');
    });

    const needle = search.trim().toLowerCase();
    if (!needle) {
      return sorted;
    }

    return sorted.filter((t) => {
      return (
        (t.author_name || '').toLowerCase().includes(needle) ||
        (t.language_name || '').toLowerCase().includes(needle) ||
        (t.name || '').toLowerCase().includes(needle)
      );
    });
  }, [search, translations]);

  const handleSelect = useCallback(
    (selected: Translation) => {
      setCurrentTranslation(selected);
      setIsOpen(false);
      setShowAll(false);
      setSearch('');
      localStorage.setItem(STORAGE_KEY, selected.id.toString());

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

  const buttonLabel = currentTranslation?.author_name || copy.buttonFallback;
  const collapsedButtonLabel = variant === 'header' ? copy.buttonCollapsed : buttonLabel;

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
        <span className="max-w-[170px] truncate">{collapsedButtonLabel}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-12 md:pt-20">
          <button
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-label={copy.closePicker}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
            <div className="border-b border-[var(--color-border)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text)]">{copy.chooseTitle}</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{copy.chooseSubtitle}</p>
                </div>
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

              {currentTranslation && (
                <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/55 px-3 py-2 text-xs text-[var(--color-text-muted)]">
                  {copy.current}: <span className="text-[var(--color-text)]">{currentTranslation.author_name}</span>
                </div>
              )}
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-3">
              {loading ? (
                <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">{copy.loading}</div>
              ) : (
                <>
                  <div className="mb-3 px-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    {copy.recommended}
                  </div>
                  <div className="space-y-1">
                    {recommendedTranslations.map((t) => (
                      <button
                        key={`recommended-${t.id}`}
                        onClick={() => handleSelect(t)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                          t.id === currentTranslation?.id
                            ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                            : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                        }`}
                      >
                        <span className="text-sm font-medium">{t.author_name}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{t.language_name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-[var(--color-border)] pt-3">
                    <button
                      onClick={() => setShowAll((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
                    >
                      <span>{copy.moreTranslations}</span>
                      <span>{showAll ? copy.hide : copy.show}</span>
                    </button>

                    {showAll && (
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder={copy.searchPlaceholder}
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
                        />

                        <div className="mt-2 max-h-[34vh] space-y-1 overflow-y-auto pr-1">
                          {filteredAllTranslations.map((t) => (
                            <button
                              key={`all-${t.id}`}
                              onClick={() => handleSelect(t)}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                                t.id === currentTranslation?.id
                                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                                  : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                              }`}
                            >
                              <span className="text-sm font-medium">{t.author_name}</span>
                              <span className="text-xs text-[var(--color-text-muted)]">{t.language_name}</span>
                            </button>
                          ))}
                          {filteredAllTranslations.length === 0 && (
                            <p className="px-3 py-5 text-center text-sm text-[var(--color-text-muted)]">
                              {copy.noneFound}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
