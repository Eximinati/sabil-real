'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { JourneyTranslationSelector } from './journey-translation-selector';
import { TranslationLibrarySheet } from './translation-library-sheet';
import { JourneyReciterSelector } from './journey-reciter-selector';
import { useToast } from '@/hooks/use-toast';
import { useCopy } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';
import { getDefaultTranslationIdForLanguage } from '@/lib/user-preferences';

interface Translation {
  id: number;
  author_name: string;
  language_name: string;
}

interface JourneyHeaderProps {
  currentDay: number;
  totalDays: number;
  completedDays: number;
  streak?: number;
  estimatedMinutes: number;
  nextLessonHref?: string;
}

export function JourneyHeader({
  currentDay,
  totalDays,
  completedDays,
  streak = 0,
  estimatedMinutes,
  nextLessonHref,
}: JourneyHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const copy = useCopy();
  const { language } = useLanguage();
  const isUrdu = language === 'ur';
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  
  const urlTranslation = searchParams.get('translation');
  const defaultTranslationId = getDefaultTranslationIdForLanguage(language);
  const [selectedTranslation, setSelectedTranslation] = useState<number>(
    urlTranslation ? parseInt(urlTranslation, 10) : defaultTranslationId
  );
  const [selectedReciter, setSelectedReciter] = useState<number>(5);
  const [showLibrary, setShowLibrary] = useState(false);

  const progressPercent = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  useEffect(() => {
    fetch('/api/translations')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.translations || [];
        setTranslations(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const storedReciter = localStorage.getItem('sabil-reciter-id');
    if (storedReciter) {
      setSelectedReciter(parseInt(storedReciter, 10));
    }
  }, []);

  useEffect(() => {
    const urlTranslation = searchParams.get('translation');
    if (urlTranslation) {
      setSelectedTranslation(parseInt(urlTranslation, 10));
    }
  }, [searchParams]);

  const handleTranslationChange = (id: number) => {
    setSelectedTranslation(id);
    localStorage.setItem('sabil-translation-id', id.toString());
    const currentPath = window.location.pathname;
    const newUrl = `${currentPath}?translation=${id}`;
    router.push(newUrl);
  };

  const handleReciterChange = (id: number) => {
    setSelectedReciter(id);
    localStorage.setItem('sabil-reciter-id', id.toString());
    toast.success(copy.common.toasts.reciterUpdated);
  };

  const handleLibrarySelect = (id: number) => {
    setShowLibrary(false);
    handleTranslationChange(id);
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

  return (
    <div className="bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-surface)] to-[var(--color-accent)]/5 border border-[var(--color-border)] rounded-2xl p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl font-arabic text-[var(--color-accent)]" dir="rtl">رحلتي</span>
            <span className="text-[var(--color-text-muted)] text-sm">{isUrdu ? 'میرا سفر' : 'My Journey'}</span>
          </div>
          <p className="text-[var(--color-text-muted)] text-sm">
            {copy.common.labels.day} {currentDay} {isUrdu ? 'میں سے' : 'of'} {totalDays}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {streak > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-accent)]/10 rounded-full">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-medium text-[var(--color-accent)]">{isUrdu ? `${streak} دن کا تسلسل` : `${streak} day streak`}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isUrdu ? `~${estimatedMinutes} منٹ/دن` : `~${estimatedMinutes} min/day`}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[var(--color-text-muted)]">{isUrdu ? 'پیش رفت' : 'Progress'}</span>
          <span className="text-[var(--color-text)] font-medium">{isUrdu ? `${totalDays} میں سے ${completedDays} دن` : `${completedDays} of ${totalDays} days`}</span>
        </div>
        <div className="h-3 bg-[var(--color-border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[var(--color-border)]">
        <JourneyTranslationSelector 
          currentTranslationId={selectedTranslation} 
          variant="header"
          onOpenLibrary={() => setShowLibrary(true)}
        />
        <JourneyReciterSelector
          currentReciterId={selectedReciter}
          onReciterChange={handleReciterChange}
        />

        {nextLessonHref && completedDays > 0 && completedDays < totalDays && (
          <a
            href={nextLessonHref}
            className="ml-auto bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors flex items-center gap-2"
          >
            {copy.common.actions.continueJourney}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        )}
      </div>

      <TranslationLibrarySheet
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        currentTranslationId={selectedTranslation}
        onSelect={handleLibrarySelect}
        preferredLanguage={isUrdu ? 'urdu' : 'english'}
        copy={libraryCopy}
      />
    </div>
  );
}
