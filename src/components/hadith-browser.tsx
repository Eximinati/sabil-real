'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmptyState } from './ui/empty-state';
import { getCachedHadithCollections } from '@/lib/api-utils';
import { fetchHadith } from '@/lib/hadith-cache';
import {
  getStoredHadithLanguage,
  setStoredHadithLanguage,
  addRecentHadithLanguage,
} from '@/lib/hadith-preferences';
import { useCopy, useI18nText } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';

interface HadithCollection {
  id: string;
  name: string;
  arabic: string;
}

interface HadithData {
  name: string;
  number: string;
  section?: string;
  arabic?: string | null;
  english?: string;
  urdu?: string | null;
  available_languages?: string[];
}

interface HadithBrowserProps {
  initialCollection?: string;
  initialNumber?: string;
}

const HadithBrowserInner = memo(function HadithBrowserInner({
  initialCollection,
  initialNumber,
}: HadithBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copy = useCopy();
  const { interpolate } = useI18nText();
  const { language } = useLanguage();
  const [collections, setCollections] = useState<HadithCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [hadith, setHadith] = useState<HadithData | null>(null);
  const [hadithLoading, setHadithLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const collection = searchParams.get('collection') || initialCollection || '';
  const defaultNumber = collection === 'muslim' ? 93 : 1;
  const number = searchParams.get('number') || initialNumber || defaultNumber.toString();
  const requestedTextLanguage = searchParams.get('lang');
  const [textLanguage, setTextLanguage] = useState<'english' | 'urdu'>(() => {
    if (requestedTextLanguage === 'english' || requestedTextLanguage === 'urdu') {
      return requestedTextLanguage;
    }
    const stored = getStoredHadithLanguage();
    if (stored === 'english' || stored === 'urdu') return stored;
    return language === 'ur' ? 'urdu' : 'english';
  });

  useEffect(() => {
    if (requestedTextLanguage === 'urdu' || requestedTextLanguage === 'english') {
      setTextLanguage(requestedTextLanguage);
      return;
    }
    const stored = getStoredHadithLanguage();
    if (stored === 'english' || stored === 'urdu') {
      setTextLanguage(stored);
      return;
    }
    setTextLanguage(language === 'ur' ? 'urdu' : 'english');
  }, [language, requestedTextLanguage]);

  const buildHadithUrl = useCallback(
    (nextCollection: string, nextNumber: string, nextLanguage: 'english' | 'urdu' = textLanguage) => {
      const params = new URLSearchParams();
      params.set('collection', nextCollection);
      params.set('number', nextNumber);
      params.set('lang', nextLanguage);
      return `/hadith?${params.toString()}`;
    },
    [textLanguage]
  );

  useEffect(() => {
    let mounted = true;
    
    async function loadCollections() {
      try {
        const data = await getCachedHadithCollections();
        if (mounted) {
          setCollections(data);
        }
      } catch {
        if (mounted) {
          setError(copy.hadith.couldNotLoadCollections);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCollections();

    return () => {
      mounted = false;
    };
  }, [copy.hadith.couldNotLoadCollections]);

  useEffect(() => {
    if (!collection || !number) return;
    
    let mounted = true;
    
    async function loadHadith() {
      setHadithLoading(true);
      setError(null);
      setHadith(null);
      
      try {
        const data = await fetchHadith(collection, parseInt(number, 10));
        if (mounted) {
          if (data?.error) {
            setError(data.error);
          } else if (data?.hadith) {
            setHadith(data.hadith);
          }
        }
      } catch {
        if (mounted) {
          setError(copy.hadith.couldNotLoadHadith);
        }
      } finally {
        if (mounted) {
          setHadithLoading(false);
        }
      }
    }

    loadHadith();

    return () => {
      mounted = false;
    };
  }, [collection, copy.hadith.couldNotLoadHadith, number]);

  const handleCollectionSelect = useCallback((collectionId: string) => {
    const defaultNum = collectionId === 'muslim' ? '93' : '1';
    router.push(buildHadithUrl(collectionId, defaultNum));
  }, [buildHadithUrl, router]);

  const handleRead = useCallback(() => {
    if (!number || parseInt(number, 10) < 1) return;
    router.push(buildHadithUrl(collection, number));
  }, [buildHadithUrl, collection, number, router]);

  const navigateHadith = useCallback((delta: number) => {
    const currentNum = parseInt(number, 10) || 1;
    const newNum = Math.max(1, currentNum + delta);
    router.push(buildHadithUrl(collection, newNum.toString()));
  }, [buildHadithUrl, collection, number, router]);

  const handleInputChange = useCallback((value: string) => {
    router.push(buildHadithUrl(collection, value));
  }, [buildHadithUrl, collection, router]);

  const handleLanguageChange = useCallback((nextLanguage: 'english' | 'urdu') => {
    setTextLanguage(nextLanguage);
    setStoredHadithLanguage(nextLanguage);
    addRecentHadithLanguage(nextLanguage);
    if (!collection) {
      return;
    }
    router.push(buildHadithUrl(collection, number, nextLanguage));
  }, [buildHadithUrl, collection, number, router]);

  const goBack = useCallback(() => {
    router.push('/hadith');
  }, [router]);

  const hadithUi = language === 'ur'
    ? {
        sourceFrame: 'اصل ماخذ',
        sourceHint: 'متن کو ماخذ کے طور پر پڑھیں۔',
        arabicSource: 'عربی متن',
        translationFrame: 'فہم کے لیے ترجمہ',
        translationHint: 'یہ حصہ معنی کے لیے ہے، اصل متن نہیں۔',
        englishLabel: 'English',
        urduLabel: 'اردو',
        selectedLanguageMissing: 'اس حدیث میں منتخب زبان دستیاب نہیں، دوسری زبان دکھائی جا رہی ہے۔',
      }
    : {
        sourceFrame: 'Sacred source text',
        sourceHint: 'Read this as transmitted source text.',
        arabicSource: 'Arabic source',
        translationFrame: 'Meaning translation',
        translationHint: 'This supports understanding and is not the source wording.',
        englishLabel: 'English',
        urduLabel: 'Urdu',
        selectedLanguageMissing: 'Your selected language is unavailable for this hadith, so the available translation is shown.',
      };

  const availableEnglish = Boolean(hadith?.english);
  const availableUrdu = Boolean(hadith?.urdu);
  const canShowLanguageSwitch = availableEnglish || availableUrdu;

  const displayedText = textLanguage === 'urdu'
    ? hadith?.urdu || hadith?.english || ''
    : hadith?.english || hadith?.urdu || '';
  const displayedLanguage = textLanguage === 'urdu'
    ? (hadith?.urdu ? 'urdu' : hadith?.english ? 'english' : null)
    : (hadith?.english ? 'english' : hadith?.urdu ? 'urdu' : null);
  const showLanguageFallbackNotice = Boolean(hadith && displayedLanguage && displayedLanguage !== textLanguage);

  if (loading) {
    return (
      <div className="px-4 md:px-16 pt-8 md:pt-12 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="h-48 bg-[var(--color-border)] animate-pulse rounded-xl mb-4" />
          <div className="h-48 bg-[var(--color-border)] animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="reading-screen px-4 md:px-16 pt-7 md:pt-12 pb-20 md:pb-12" data-script-direction={language === 'ur' ? 'rtl' : 'ltr'}>
      <div className="text-center mb-9 reading-section">
        <h1 className="font-arabic text-[36px] text-[var(--color-accent)]" dir="rtl">الحديث</h1>
        <p className={`text-[var(--color-text-muted)] mt-2 ${language === 'ur' ? 'font-urdu text-[16px] leading-[2.05]' : 'text-sm leading-[1.8]'}`}>
          {copy.hadith.subtitle}
        </p>
        <p className={`text-[var(--color-text-muted)] mt-1 max-w-lg mx-auto ${language === 'ur' ? 'font-urdu text-[16px] leading-[2.05]' : 'text-sm leading-[1.8]'}`}>
          {copy.hadith.description}
        </p>
      </div>

      {!collection ? (
        <div className="max-w-[680px] mx-auto">
          {collections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {collections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCollectionSelect(c.id)}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 text-left hover:border-[var(--color-primary)] transition-colors card-hover"
                  aria-label={interpolate(copy.hadith.selectCollectionAria, { name: c.name })}
                >
                  <span className="font-arabic text-[22px] text-[var(--color-accent)] block" dir="rtl">
                    {c.arabic}
                  </span>
                  <span className="text-sm text-[var(--color-text-muted)] mt-1 block">{c.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="hadith"
              title={copy.hadith.noCollectionsTitle}
              description={copy.hadith.noCollectionsDescription}
              actionLabel={copy.hadith.refresh}
              onAction={() => window.location.reload()}
            />
          )}
        </div>
      ) : (
        <div className="max-w-[680px] mx-auto">
          <button
            onClick={goBack}
            className="text-[var(--color-primary)] hover:underline mb-6 block"
            aria-label={copy.hadith.backToCollections}
          >
            ← {copy.hadith.backToCollections}
          </button>

          <div className="quiet-controls flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
            <label htmlFor="hadith-number" className="text-sm text-[var(--color-text-muted)]">{copy.hadith.enterNumber}</label>
            <input
              id="hadith-number"
              type="number"
              value={number}
              onChange={(e) => handleInputChange(e.target.value)}
              min={1}
              className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 w-24 transition-all"
              aria-label={copy.hadith.numberInputAria}
            />
            <button
              onClick={handleRead}
              disabled={hadithLoading || !number}
              className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50"
            >
              {copy.hadith.read}
            </button>
          </div>

          {hadithLoading ? (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-[var(--color-border)] rounded w-1/3" />
                <div className="h-4 bg-[var(--color-border)] rounded w-full" />
                <div className="h-4 bg-[var(--color-border)] rounded w-2/3" />
              </div>
            </div>
          ) : error ? (
            <EmptyState
              icon="hadith"
              title={copy.hadith.loadErrorTitle}
              description={copy.hadith.loadErrorDescription}
            />
          ) : hadith ? (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 md:p-6 reading-section">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <span className="text-[var(--color-primary)] font-medium">{hadith.name}</span>
                <span className="bg-[var(--color-accent)] text-white text-xs px-3 py-1 rounded-full">
                  {interpolate(copy.hadith.hadithBadge, { number: hadith.number })}
                </span>
              </div>
              
              {hadith.section && (
                <p className="text-xs text-[var(--color-text-muted)] mb-3">{copy.hadith.chapterLabel}: {hadith.section}</p>
              )}

              {canShowLanguageSwitch && (
                <div className="quiet-controls mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/45 px-3 py-2">
                  <span className="text-xs text-[var(--color-text-muted)]">{hadithUi.translationFrame}</span>
                  <div className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
                    <button
                      onClick={() => handleLanguageChange('english')}
                      disabled={!availableEnglish}
                      className={`rounded-full px-3 py-1 text-xs transition-colors ${
                        textLanguage === 'english'
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]'
                      } disabled:opacity-40`}
                    >
                      {hadithUi.englishLabel}
                    </button>
                    <button
                      onClick={() => handleLanguageChange('urdu')}
                      disabled={!availableUrdu}
                      className={`rounded-full px-3 py-1 text-xs transition-colors ${
                        textLanguage === 'urdu'
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]'
                      } disabled:opacity-40`}
                    >
                      {hadithUi.urduLabel}
                    </button>
                  </div>
                </div>
              )}

              {showLanguageFallbackNotice && (
                <p className="mb-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/45 px-3 py-2 text-xs text-[var(--color-text-muted)]">
                  {hadithUi.selectedLanguageMissing}
                </p>
              )}

              {hadith.arabic && (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/35 p-4 mb-3">
                  <div className="mb-2">
                    <p className="text-xs font-medium text-[var(--color-primary)]">{hadithUi.sourceFrame}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{hadithUi.sourceHint}</p>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">{hadithUi.arabicSource}</p>
                  <p className="reading-arabic font-arabic text-right text-[22px] text-[var(--color-text)]" dir="rtl">
                    {hadith.arabic}
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/30 p-4">
                <div className="mb-2">
                  <p className="text-xs font-medium text-[var(--color-primary)]">{hadithUi.translationFrame}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">{hadithUi.translationHint}</p>
                </div>
                {displayedText ? (
                  <p
                    className={`text-[15px] leading-[2] text-[var(--color-text)] ${
                      displayedLanguage === 'urdu' ? 'font-urdu text-[17px] leading-[2.15]' : ''
                    }`}
                    dir={displayedLanguage === 'urdu' ? 'rtl' : 'ltr'}
                    data-script-direction={displayedLanguage === 'urdu' ? 'rtl' : 'ltr'}
                  >
                    {displayedText}
                  </p>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-[var(--color-text-muted)] text-sm">
                      {copy.hadith.textUnavailable}
                    </p>
                    <p className="text-[var(--color-text-muted)] text-xs mt-1">
                      {copy.hadith.textUnavailableHint}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="quiet-controls flex justify-between mt-6 pt-4 border-t border-[var(--color-border)]">
                <button
                  onClick={() => navigateHadith(-1)}
                  disabled={parseInt(number, 10) <= 1}
                  className="text-sm text-[var(--color-primary)] hover:underline disabled:opacity-50"
                  aria-label={copy.hadith.previousAria}
                >
                  ← {copy.hadith.previous}
                </button>
                <button
                  onClick={() => navigateHadith(1)}
                  className="text-sm text-[var(--color-primary)] hover:underline"
                  aria-label={copy.hadith.nextAria}
                >
                  {copy.hadith.next} →
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="hadith"
              title={copy.hadith.selectHadithTitle}
              description={copy.hadith.selectHadithDescription}
            />
          )}
        </div>
      )}
    </div>
  );
});

export function HadithBrowser(props: HadithBrowserProps) {
  return <HadithBrowserInner {...props} />;
}
