'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCopy } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';
import {
  getStoredTafsirId,
  setStoredTafsirId,
  addRecentTafsirId,
  getRecentTafsirIds,
  getStoredTafsirLanguage,
  setStoredTafsirLanguage,
} from '@/lib/tafsir-preferences';
import type { TafsirLanguagePreference } from '@/lib/tafsir-preferences';
import { ReadingPreferencesSheet } from './reading-preferences-sheet';
import { TranslationLibrarySheet } from './translation-library-sheet';
import { ReciterLibrarySheet } from './reciter-library-sheet';

interface Tafsir {
  id: number;
  name: string;
  author_name: string | null;
  language_name: string;
}

interface TafsirSelectorProps {
  initialTafsirs: Tafsir[];
}

export function TafsirSelector({ initialTafsirs }: TafsirSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copy = useCopy();
  const { language } = useLanguage();
  const [tafsirs] = useState<Tafsir[]>(initialTafsirs);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');
  const [showPrefs, setShowPrefs] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showReciterLibrary, setShowReciterLibrary] = useState(false);

  const tafsirParam = searchParams.get('tafsir');
  const surahParam = searchParams.get('surah');

  const currentTafsir = tafsirParam || '';

  const [tafsirFilterLang, setTafsirFilterLang] = useState<'english' | 'urdu'>(
    language === 'ur' ? 'urdu' : 'english'
  );
  const [preferredLang, setPreferredLang] = useState<TafsirLanguagePreference>('auto');

  useEffect(() => {
    const storedLang = getStoredTafsirLanguage();
    setPreferredLang(storedLang);
    if (storedLang !== 'auto') {
      if (storedLang === 'en') setTafsirFilterLang('english');
      else if (storedLang === 'ur') setTafsirFilterLang('urdu');
    }

    if (!tafsirParam) {
      const storedId = getStoredTafsirId();
      const params = new URLSearchParams(searchParams.toString());
      params.set('tafsir', storedId.toString());
      router.replace(`/tafsir?${params.toString()}`);
    }
  }, []);

  const recommendedTafsirs = useMemo(() => {
    return [...tafsirs]
      .sort((a, b) => {
        const aLang = (a.language_name || '').toLowerCase() === tafsirFilterLang ? 0 : 1;
        const bLang = (b.language_name || '').toLowerCase() === tafsirFilterLang ? 0 : 1;
        if (aLang !== bLang) {
          return aLang - bLang;
        }

        return (a.author_name || a.name || '').localeCompare(b.author_name || b.name || '');
      })
      .slice(0, 5);
  }, [tafsirFilterLang, tafsirs]);

  const filteredTafsirs = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return [...tafsirs].sort((a, b) => (a.language_name || '').localeCompare(b.language_name || ''));
    }

    return tafsirs.filter((tafsir) => {
      return (
        (tafsir.author_name || '').toLowerCase().includes(needle) ||
        (tafsir.name || '').toLowerCase().includes(needle) ||
        (tafsir.language_name || '').toLowerCase().includes(needle)
      );
    });
  }, [search, tafsirs]);

  const handleSelect = (tafsirId: string) => {
    const id = parseInt(tafsirId, 10);
    setStoredTafsirId(id);
    addRecentTafsirId(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tafsir', tafsirId);
    router.push(`/tafsir?${params.toString()}`);
  };

  const currentTafsirData = tafsirs.find((t) => t.id.toString() === currentTafsir);
  const currentTafsirName = currentTafsirData
    ? currentTafsirData.author_name || currentTafsirData.name
    : undefined;

  const [recentTafsirIds, setRecentTafsirIds] = useState<number[]>([]);
  const [selectedTransId, setSelectedTransId] = useState(203);
  const [selectedReciterId, setSelectedReciterId] = useState(5);

  useEffect(() => {
    setRecentTafsirIds(getRecentTafsirIds());
    try {
      const v = localStorage.getItem('sabil-translation-id');
      if (v) setSelectedTransId(parseInt(v, 10));
    } catch {}
    try {
      const v = localStorage.getItem('sabil-reciter-id');
      if (v) setSelectedReciterId(parseInt(v, 10));
    } catch {}
  }, []);

  const recentTafsirs = useMemo(
    () =>
      recentTafsirIds
        .map((id) => tafsirs.find((t) => t.id === id))
        .filter((t): t is Tafsir => !!t)
        .filter((t) => t.id.toString() !== currentTafsir)
        .slice(0, 3),
    [recentTafsirIds, tafsirs, currentTafsir]
  );

  const handlePrefsTafsirChange = (id: number) => {
    setStoredTafsirId(id);
    addRecentTafsirId(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tafsir', id.toString());
    router.push(`/tafsir?${params.toString()}`);
  };

  const handlePrefsTranslationChange = (id: number) => {
    localStorage.setItem('sabil-translation-id', id.toString());
  };

  const handlePrefsReciterChange = (id: number) => {
    localStorage.setItem('sabil-reciter-id', id.toString());
  };

  const handlePrefsLanguageChange = (lang: TafsirLanguagePreference) => {
    setStoredTafsirLanguage(lang);
  };

  const isUrdu = language === 'ur';
  const readingPrefsCopy = {
    readingPreferences: isUrdu ? 'پڑھنے کی ترجیحات' : 'Reading Preferences',
    journeyLanguage: isUrdu ? 'سفر کی زبان' : 'Journey Language',
    auto: isUrdu ? 'آٹو' : 'Auto',
    english: isUrdu ? 'انگریزی' : 'English',
    urdu: isUrdu ? 'اردو' : 'Urdu',
    translation: isUrdu ? 'ترجمہ' : 'Translation',
    reciter: isUrdu ? 'قاری' : 'Reciter',
    tafsir: isUrdu ? 'تفسیر' : 'Tafsir Scholar',
    manageTranslations: isUrdu ? 'تراجم کا نظم کریں' : 'Manage Translations',
    manageReciters: isUrdu ? 'قاریوں کا نظم کریں' : 'Manage Reciters',
    manageTafsirScholars: isUrdu ? 'مفسرین کا نظم کریں' : 'Browse Scholars',
    readingStyle: isUrdu ? 'پڑھنے کا انداز' : 'Reading Style',
    comfortable: isUrdu ? 'آرام دہ' : 'Comfortable',
    focused: isUrdu ? 'مرتکز' : 'Focused',
    largeText: isUrdu ? 'بڑا متن' : 'Large Text',
    audio: isUrdu ? 'آڈیو' : 'Audio',
    enabled: isUrdu ? 'فعال' : 'Enabled',
    manageAudio: isUrdu ? 'آڈیو کا نظم کریں' : 'Manage Audio',
    close: isUrdu ? 'بند کریں' : 'Close',
    tafsirLibrary: isUrdu ? 'تفسیر کی لائبریری' : 'Tafsir Library',
  };

  const handleOpenTranslationLibrary = () => {
    setShowPrefs(false);
    setShowLibrary(true);
  };

  const handleOpenReciterLibrary = () => {
    setShowPrefs(false);
    setShowReciterLibrary(true);
  };

  const handleLibrarySelect = (id: number) => {
    setShowLibrary(false);
    handlePrefsTranslationChange(id);
  };

  const handleReciterLibrarySelect = (id: number) => {
    setShowReciterLibrary(false);
    handlePrefsReciterChange(id);
  };

  const libraryCopy = {
    translationLibrary: isUrdu ? 'تراجم کی لائبریری' : 'Translation Library',
    searchPlaceholder: isUrdu ? 'زبان یا مترجم تلاش کریں' : 'Search language or translator',
    recentlyUsed: isUrdu ? 'حالیہ استعمال شدہ' : 'Recently Used',
    recommended: isUrdu ? 'تجویز کردہ' : 'Recommended',
    urduSection: isUrdu ? 'اردو' : 'Urdu',
    englishSection: isUrdu ? 'انگریزی' : 'English',
    otherLanguages: isUrdu ? 'دیگر زبانیں' : 'Other Languages',
    noResults: isUrdu ? 'کوئی ترجمہ نہیں ملا۔' : 'No translations found.',
  };

  const reciterLibraryCopy = {
    reciterLibrary: isUrdu ? 'قاریوں کی لائبریری' : 'Reciter Library',
    searchPlaceholder: isUrdu ? 'قاری تلاش کریں' : 'Search reciters',
    currentReciter: isUrdu ? 'موجودہ قاری' : 'Current Reciter',
    recentlyUsed: isUrdu ? 'حالیہ استعمال شدہ' : 'Recently Used',
    recommended: isUrdu ? 'سارے قاری' : 'All Reciters',
    allReciters: isUrdu ? 'تمام قاری' : 'All Reciters',
    noResults: isUrdu ? 'کوئی قاری نہیں ملا۔' : 'No reciters found.',
  };

  return (
    <div>
      <button
        onClick={() => setShowPrefs(true)}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-3 py-2.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)]/30"
      >
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {isUrdu ? 'پڑھنے کی ترجیحات' : 'Reading Preferences'}
        </span>
        <svg className="h-4 w-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">{copy.tafsir.selectTafsir}</h3>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-3 quiet-controls">
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          Recommended
        </p>
        <div className="space-y-2">
          {recommendedTafsirs.map((tafsir) => (
            <button
              key={tafsir.id}
              onClick={() => handleSelect(tafsir.id.toString())}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                currentTafsir === tafsir.id.toString()
                  ? 'border-[var(--color-primary)] bg-[var(--color-bg)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
              }`}
            >
              <p className="font-medium text-[var(--color-text)]">{tafsir.author_name || tafsir.name}</p>
              <p className="text-sm text-[var(--color-text-muted)]">{tafsir.language_name}</p>
            </button>
          ))}
        </div>

        {recentTafsirs.length > 0 && (
          <div className="mt-3 border-t border-[var(--color-border)] pt-3">
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              {isUrdu ? 'حالیہ استعمال شدہ' : 'Recently Used'}
            </p>
            <div className="space-y-2">
              {recentTafsirs.map((tafsir) => (
                <button
                  key={`recent-${tafsir.id}`}
                  onClick={() => handleSelect(tafsir.id.toString())}
                  className="w-full text-left p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                >
                  <p className="font-medium text-[var(--color-text)]">{tafsir.author_name || tafsir.name}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">{tafsir.language_name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 border-t border-[var(--color-border)] pt-3">
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
          >
            {showAll ? 'Hide full tafsir list' : 'Show full tafsir list'}
          </button>

          {showAll && (
            <div className="mt-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tafsir source"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
              />
              <div className="mt-2 max-h-[260px] space-y-2 overflow-y-auto pr-1">
                {filteredTafsirs.map((tafsir) => (
                  <button
                    key={`all-${tafsir.id}`}
                    onClick={() => handleSelect(tafsir.id.toString())}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      currentTafsir === tafsir.id.toString()
                        ? 'border-[var(--color-primary)] bg-[var(--color-bg)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
                    }`}
                  >
                    <p className="font-medium text-[var(--color-text)]">{tafsir.author_name || tafsir.name}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{tafsir.language_name}</p>
                  </button>
                ))}
                {filteredTafsirs.length === 0 && (
                  <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">No tafsir sources found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ReadingPreferencesSheet
        isOpen={showPrefs}
        onClose={() => setShowPrefs(false)}
        currentTranslationId={selectedTransId}
        currentReciterId={selectedReciterId}
        onTranslationChange={handlePrefsTranslationChange}
        onReciterChange={handlePrefsReciterChange}
        onOpenTranslationLibrary={handleOpenTranslationLibrary}
        onOpenReciterLibrary={handleOpenReciterLibrary}
        currentTafsirId={parseInt(currentTafsir, 10)}
        currentTafsirName={currentTafsirName}
        onTafsirChange={handlePrefsTafsirChange}
        tafsirPreferredLanguage={preferredLang}
        onTafsirLanguageChange={handlePrefsLanguageChange}
        hideJourneyLanguage
        hideHadithLanguage
        copy={readingPrefsCopy}
      />

      <TranslationLibrarySheet
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        currentTranslationId={selectedTransId}
        onSelect={handleLibrarySelect}
        preferredLanguage={tafsirFilterLang}
        copy={libraryCopy}
      />

      <ReciterLibrarySheet
        isOpen={showReciterLibrary}
        onClose={() => setShowReciterLibrary(false)}
        currentReciterId={selectedReciterId}
        onSelect={handleReciterLibrarySelect}
        copy={reciterLibraryCopy}
      />
    </div>
  );
}
