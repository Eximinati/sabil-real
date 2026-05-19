'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

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

const LANGUAGE_CATEGORIES = [
  { id: 'all', label: 'All', pattern: null },
  { id: 'English', label: 'English', pattern: /^english$/i },
  { id: 'Urdu', label: 'Urdu', pattern: /^urdu$/i },
  { id: 'Arabic', label: 'Arabic', pattern: /^arabic$/i },
  { id: 'Indonesian', label: 'Indonesian', pattern: /^indonesian$/i },
  { id: 'French', label: 'French', pattern: /^french$/i },
  { id: 'German', label: 'German', pattern: /^german$/i },
  { id: 'Spanish', label: 'Spanish', pattern: /^spanish$/i },
  { id: 'Turkish', label: 'Turkish', pattern: /^turkish$/i },
  { id: 'Other', label: 'Other', pattern: /^(?!english|urdu|arabic|indonesian|french|german|spanish|turkish).+$/i },
];

const STORAGE_KEY = 'sabil-recent-translations';

export function JourneyTranslationSelector({ 
  currentTranslationId,
  onTranslationChange,
  variant = 'lesson'
}: JourneyTranslationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentTranslation, setCurrentTranslation] = useState<Translation | null>(null);
  const [recentTranslations, setRecentTranslations] = useState<number[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/translations')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.translations || [];
        setTranslations(list);
        const current = list.find((t: Translation) => t.id === currentTranslationId);
        setCurrentTranslation(current || list[0] || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentTranslationId]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecentTranslations(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleSelect = useCallback((translation: Translation) => {
    setCurrentTranslation(translation);
    setIsOpen(false);
    
    const updatedRecent = [translation.id, ...recentTranslations.filter(id => id !== translation.id)].slice(0, 5);
    setRecentTranslations(updatedRecent);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecent));
    
    if (onTranslationChange) {
      onTranslationChange(translation.id);
    } else {
      const currentPath = window.location.pathname;
      const newUrl = `${currentPath}?translation=${translation.id}`;
      window.location.href = newUrl;
    }
  }, [onTranslationChange, recentTranslations]);

  const filteredTranslations = useMemo(() => {
    let filtered = translations;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = translations.filter(t => 
        (t.author_name || '').toLowerCase().includes(searchLower) ||
        (t.language_name || '').toLowerCase().includes(searchLower) ||
        (t.name || '').toLowerCase().includes(searchLower)
      );
    }

    if (activeCategory !== 'all') {
      const category = LANGUAGE_CATEGORIES.find(c => c.id === activeCategory);
      if (category?.pattern) {
        filtered = filtered.filter(t => {
          const lang = t.language_name || '';
          return category.pattern!.test(lang);
        });
      }
    }

    return filtered;
  }, [translations, search, activeCategory]);

  const groupedTranslations = useMemo(() => {
    return filteredTranslations.reduce((acc, t) => {
      const lang = t.language_name || 'Other';
      if (!acc[lang]) acc[lang] = [];
      acc[lang].push(t);
      return acc;
    }, {} as Record<string, Translation[]>);
  }, [filteredTranslations]);

  const myTranslations = useMemo(() => {
    return recentTranslations
      .map(id => translations.find(t => t.id === id))
      .filter((t): t is Translation => t !== undefined);
  }, [recentTranslations, translations]);

  const buttonText = currentTranslation 
    ? `${currentTranslation.language_name || 'Translation'}: ${currentTranslation.author_name}`
    : 'Select Translation';

  const displayText = buttonText.length > 35 
    ? buttonText.slice(0, 35) + '...' 
    : buttonText;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 text-sm rounded-full border transition-all ${
          variant === 'header'
            ? 'px-3 py-1.5 border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-primary)]/50 text-[var(--color-text-secondary)]'
            : 'px-3 py-1.5 border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50 text-[var(--color-text-secondary)]'
        }`}
        aria-label="Change translation"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span className="max-w-[150px] truncate hidden sm:inline">{displayText}</span>
        <span className="sm:hidden">Language</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 md:pt-20 px-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            ref={modalRef}
            className="relative w-full max-w-md bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] overflow-hidden max-h-[85vh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="translation-modal-title"
          >
            <div className="p-4 border-b border-[var(--color-border)] shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 id="translation-modal-title" className="text-lg font-semibold text-[var(--color-text)]">
                  Translation
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-[var(--color-border)]/50 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="flex gap-1 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                {LANGUAGE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all ${
                      activeCategory === cat.id
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="p-8 text-center text-[var(--color-text-muted)]">
                  <svg className="w-6 h-6 mx-auto animate-spin mb-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading...
                </div>
              ) : (
                <div className="p-2">
                  {myTranslations.length > 0 && !search && activeCategory === 'all' && (
                    <div className="mb-4">
                      <div className="px-3 py-2 text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Recent
                      </div>
                      {myTranslations.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleSelect(t)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                            t.id === currentTranslation?.id
                              ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                              : 'hover:bg-[var(--color-bg)] text-[var(--color-text)]'
                          }`}
                        >
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">{t.author_name}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">{t.language_name}</span>
                          </div>
                          {t.id === currentTranslation?.id && (
                            <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {Object.keys(groupedTranslations).length === 0 ? (
                    <div className="p-8 text-center text-[var(--color-text-muted)]">
                      No translations found
                    </div>
                  ) : (
                    Object.entries(groupedTranslations).map(([language, langTranslations]) => (
                      <div key={language} className="mb-2">
                        <div className="px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)]/50">
                          {language}
                        </div>
                        {langTranslations.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleSelect(t)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                              t.id === currentTranslation?.id
                                ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                                : 'hover:bg-[var(--color-bg)] text-[var(--color-text)]'
                            }`}
                          >
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-medium">{t.author_name}</span>
                            </div>
                            {t.id === currentTranslation?.id && (
                              <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}