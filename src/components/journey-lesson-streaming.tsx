'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  VerseSectionSkeleton, 
  HadithSectionSkeleton,
  ReflectionSectionSkeleton,
  CompleteButtonSkeleton,
  TafsirSectionSkeleton
} from './journey-lesson-skeleton';
import { JourneyTafsirStreaming } from './journey-tafsir-streaming';
import { JourneyTranslationSelector } from './journey-translation-selector';
import { TranslationLibrarySheet } from './translation-library-sheet';
import { JourneyReciterSelector } from './journey-reciter-selector';
import { useToast } from '@/hooks/use-toast';
import { useCopy } from '@/hooks/use-copy';
import { useFocusMode } from './focus-mode-provider';
import { AudioPlayer } from './audio-player';
import { DayOneCanonicalExperience } from './journey-day-one-canonical';
import { WEEKLY_EMOTIONAL_ARCS, getWeekForDay } from '@/lib/journey-emotional-arc';
import type { JourneyLanguageContext } from '@/types/journey-localization';
import { useLanguage } from '@/lib/i18n/context';
import type { CanonicalJourneyPlan } from '@/lib/journey-canonical';

interface LessonData {
  id: string;
  day_number: number;
  title: string;
  subtitle: string | null;
  topic: string;
  description: string | null;
  verse_keys: string[];
  lesson_text: string | null;
  hadith_text: string | null;
  hadith_source: string | null;
  hadith_collection: string | null;
  hadith_number: number | null;
  reflection_prompt: string | null;
  estimated_minutes: number;
  language_context?: JourneyLanguageContext;
}

interface LessonBlock {
  id: string;
  lesson_id: string;
  order_index: number;
  block_type: string;
  content: Record<string, unknown>;
}

interface StreamingLessonClientProps {
  lesson: LessonData;
  blocks?: LessonBlock[];
  canonicalPlan?: CanonicalJourneyPlan;
  initialReflection: string;
  isCompleted: boolean;
  translationId: number;
  tafsirId?: number;
  hadithLanguage?: 'auto' | 'english' | 'urdu';
  journeyLanguage?: 'auto' | 'en' | 'ur';
  urlTranslation?: string | null;
  hasNextDay?: boolean;
}

const REQUIRED_CANONICAL_SECTION_ORDER: Array<CanonicalJourneyPlan['sections'][number]['id']> = [
  'opening-reflection',
  'seerah-moment',
  'quran-reflection',
  'hadith-connection',
  'reflection-prompt',
  'tiny-action',
  'closing-dua',
];

function buildSectionTitleMap(canonicalPlan?: CanonicalJourneyPlan) {
  if (!canonicalPlan) {
    return {};
  }

  return Object.fromEntries(
    canonicalPlan.sections.map((section) => [section.id, section.title])
  ) as Record<string, string>;
}

function resolveCanonicalTextBySectionId(
  canonicalPlan: CanonicalJourneyPlan | undefined,
  sectionId: CanonicalJourneyPlan['sections'][number]['id']
): string | undefined {
  return canonicalPlan?.sections.find((section) => section.id === sectionId)?.bodyText;
}

function isCanonicalPlanComplete(canonicalPlan?: CanonicalJourneyPlan): boolean {
  if (!canonicalPlan || !canonicalPlan.isCanonical) {
    return false;
  }

  const available = new Set(
    canonicalPlan.sections
      .filter((section) => typeof section.bodyText === 'string' && section.bodyText.trim().length > 0)
      .map((section) => section.id)
  );

  return REQUIRED_CANONICAL_SECTION_ORDER.every((sectionId) => available.has(sectionId));
}

function StreamSectionLogger({ name, children }: { name: string; children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const timer = setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Stream] ${name} resolved`);
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [name]);
  
  return <>{children}</>;
}

function JourneyLessonHeader({ 
  translationId,
  journeyLanguage = 'auto',
  selectedJourneyLanguage,
  onJourneyLanguageChange,
  urlTranslation,
}: { 
  translationId: number;
  journeyLanguage?: 'auto' | 'en' | 'ur';
  selectedJourneyLanguage: 'auto' | 'en' | 'ur';
  onJourneyLanguageChange: (value: 'auto' | 'en' | 'ur') => void;
  urlTranslation?: string | null;
}) {
  const copy = useCopy();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedTranslation, setSelectedTranslation] = useState(
    urlTranslation ? parseInt(urlTranslation, 10) : translationId
  );
  const [selectedReciter, setSelectedReciter] = useState(5);
  const [savingJourneyLanguage, setSavingJourneyLanguage] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const storedReciter = localStorage.getItem('sabil-reciter-id');
    if (storedReciter) {
      setSelectedReciter(parseInt(storedReciter, 10));
    }
  }, []);

  useEffect(() => {
    if (urlTranslation) {
      setSelectedTranslation(parseInt(urlTranslation, 10));
    }
  }, [urlTranslation]);

  const handleTranslationChange = (id: number) => {
    if (id === selectedTranslation) return;
    
    setSelectedTranslation(id);
    localStorage.setItem('sabil-translation-id', id.toString());
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('translation', id.toString());
    
    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleReciterChange = (id: number) => {
    setSelectedReciter(id);
    localStorage.setItem('sabil-reciter-id', id.toString());
    toast.success(copy.common.toasts.reciterUpdated);
  };

  const handleJourneyLanguageChange = async (value: 'auto' | 'en' | 'ur') => {
    if (value === selectedJourneyLanguage || savingJourneyLanguage) {
      return;
    }

    onJourneyLanguageChange(value);
    setSavingJourneyLanguage(true);

    try {
      const res = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journeyLanguage: value }),
      });

      if (!res.ok) {
        throw new Error('Failed to save journey language preference');
      }

      document.cookie = `sabil-journey-language=${value}; path=/; max-age=31536000; samesite=lax`;
      toast.success(copy.common.toasts.preferencesUpdated);
      router.refresh();
    } catch {
      onJourneyLanguageChange(journeyLanguage);
      toast.error(copy.common.toasts.somethingWentWrong);
    } finally {
      setSavingJourneyLanguage(false);
    }
  };

  const handleLibrarySelect = (id: number) => {
    setShowLibrary(false);
    handleTranslationChange(id);
  };

  const preferredLanguage = language === 'ur' ? 'urdu' : 'english';
  const isUrdu = language === 'ur';
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
    <div className="mb-6 md:mb-10">
      <div className="mx-auto max-w-[740px] rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]/78 px-4 py-4 backdrop-blur-sm md:px-5">
        <div className="min-w-0">
          <Link href="/journey" className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
            {copy.journey.lesson.backToJourney}
          </Link>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{copy.journey.lesson.centerPrompt}</p>
        </div>

        <details className="group mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/45 p-3">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm text-[var(--color-text-secondary)]">
            {copy.journey.lesson.readingSettings}
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-transform group-open:rotate-180">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {copy.journey.lesson.readingSettingsDescription}
          </p>
          <div className="quiet-controls mt-3 space-y-4">
            <JourneyTranslationSelector
              currentTranslationId={selectedTranslation}
              variant="inline"
              onTranslationChange={handleTranslationChange}
              onOpenLibrary={() => setShowLibrary(true)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <JourneyReciterSelector
                currentReciterId={selectedReciter}
                onReciterChange={handleReciterChange}
              />
              <label className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)]">
                <span className="text-[var(--color-text-muted)]">Journey</span>
                <select
                  value={selectedJourneyLanguage}
                  disabled={savingJourneyLanguage}
                  onChange={(event) =>
                    handleJourneyLanguageChange(event.target.value as 'auto' | 'en' | 'ur')
                  }
                  className="min-w-[110px] bg-transparent text-sm focus:outline-none disabled:opacity-60"
                >
                  <option value="auto">Auto</option>
                  <option value="en">English</option>
                  <option value="ur">Urdu</option>
                </select>
              </label>
            </div>
          </div>
        </details>
      </div>

      <TranslationLibrarySheet
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        currentTranslationId={selectedTranslation}
        onSelect={handleLibrarySelect}
        preferredLanguage={preferredLanguage}
        copy={libraryCopy}
      />
    </div>
  );
}

export function StreamingLessonShell({ 
  lesson, 
  blocks,
  canonicalPlan,
  initialReflection, 
  isCompleted, 
  translationId,
  tafsirId,
  hadithLanguage,
  journeyLanguage = 'auto',
  urlTranslation,
  hasNextDay
}: StreamingLessonClientProps) {
  const { isFocusMode } = useFocusMode();
  const copy = useCopy();
  const FocusModeToggle = require('./focus-mode-toggle').FocusModeToggle;
  const [clientJourneyLanguage, setClientJourneyLanguage] = useState<'auto' | 'en' | 'ur'>(journeyLanguage);

  const canUseCanonicalExperience =
    lesson.day_number >= 1 && lesson.day_number <= 5 && isCanonicalPlanComplete(canonicalPlan);
  const shouldShowCanonicalIncompleteWarning =
    lesson.day_number >= 1 && lesson.day_number <= 5 && !isCanonicalPlanComplete(canonicalPlan);
  const week = getWeekForDay(lesson.day_number);
  const currentArc = WEEKLY_EMOTIONAL_ARCS.find((arc) => arc.week === week);
  const { language } = useLanguage();
  const effectiveLanguageOverride = clientJourneyLanguage === 'auto' ? language : clientJourneyLanguage;
  const canonicalResolvedLanguage = canonicalPlan?.languageContext.resolved;
  const shouldShowLanguageFallback =
    lesson.language_context?.requested === 'ur' &&
    lesson.language_context?.resolved === 'en';
  const isUrduTopic = /[\u0600-\u06FF]/.test(lesson.topic || '');
  const isUrduTitle = /[\u0600-\u06FF]/.test(lesson.title || '');
  const isUrduSubtitle = /[\u0600-\u06FF]/.test(lesson.subtitle || '');
  const isUrduDescription = /[\u0600-\u06FF]/.test(lesson.description || '');
  const scriptDirection = language === 'ur' ? 'rtl' : 'ltr';

  const containerClass = isFocusMode ? 'max-w-[860px] mx-auto' : 'max-w-[760px] mx-auto';

  return (
    <div
      className={`reading-screen px-4 md:px-6 pt-7 md:pt-12 pb-20 md:pb-16 ${containerClass}`}
      data-script-direction={scriptDirection}
    >
      <JourneyLessonHeader 
        translationId={translationId}
        journeyLanguage={journeyLanguage}
        selectedJourneyLanguage={clientJourneyLanguage}
        onJourneyLanguageChange={setClientJourneyLanguage}
        urlTranslation={urlTranslation}
      />

      <div className="reading-section">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">{copy.common.labels.minutesAbout} {lesson.estimated_minutes} {copy.common.labels.minutesSuffix}</p>
            {currentArc && (
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {copy.journey.lesson.weekLabel} {currentArc.week}: {currentArc.chapterTitle}
              </p>
            )}
          </div>
          <div className="hidden md:block">
            <FocusModeToggle />
          </div>
        </div>
      </div>

      {canUseCanonicalExperience ? (
        <>
          {shouldShowLanguageFallback && (
            <div className="mb-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
              <p className="text-sm text-[var(--color-text)]">{copy.journey.lesson.translationFallbackTitle}</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{copy.journey.lesson.translationFallbackDescription}</p>
            </div>
          )}
          <DayOneCanonicalExperience
            key={`day-${lesson.day_number}-${effectiveLanguageOverride}-${translationId}`}
            lessonId={lesson.id}
            dayNumber={lesson.day_number}
            lessonTitle={lesson.title}
            lessonSubtitle={lesson.subtitle}
            translationId={translationId}
            tafsirId={canonicalPlan?.resolvedTafsirId || tafsirId || canonicalPlan?.defaultTafsirId}
            canonicalVerseKeys={canonicalPlan?.verseKeys}
            quranRangeLabel={canonicalPlan?.quranRangeLabel}
            quranIntroText={resolveCanonicalTextBySectionId(canonicalPlan, 'quran-reflection')}
            openingReflectionText={resolveCanonicalTextBySectionId(canonicalPlan, 'opening-reflection')}
            seerahMomentText={resolveCanonicalTextBySectionId(canonicalPlan, 'seerah-moment')}
            tafsirInsightText={resolveCanonicalTextBySectionId(canonicalPlan, 'tafsir-insight')}
            reflectionPromptText={
              resolveCanonicalTextBySectionId(canonicalPlan, 'reflection-prompt') ||
              lesson.reflection_prompt ||
              null
            }
            tinyActionText={resolveCanonicalTextBySectionId(canonicalPlan, 'tiny-action')}
            closingDuaText={resolveCanonicalTextBySectionId(canonicalPlan, 'closing-dua')}
            hadithCollection={canonicalPlan?.hadithCollection || lesson.hadith_collection}
            hadithNumber={canonicalPlan?.hadithNumber || lesson.hadith_number}
            hadithText={
              resolveCanonicalTextBySectionId(canonicalPlan, 'hadith-connection') ||
              lesson.hadith_text
            }
            hadithSource={canonicalPlan?.hadithSource || lesson.hadith_source}
            hadithLanguage={hadithLanguage}
            tafsirEnabled={canonicalPlan?.tafsir?.enabled !== false}
            tafsirRevealMode={canonicalPlan?.tafsir?.revealMode || 'condensed'}
            tafsirFallbackUsed={canonicalPlan?.tafsir?.fallbackUsed || false}
            sectionTitles={buildSectionTitleMap(canonicalPlan)}
            initialReflection={initialReflection}
            isCompleted={isCompleted}
            hasNextDay={hasNextDay}
            languageOverride={effectiveLanguageOverride}
          />
        </>
      ) : (
        <>
          {shouldShowCanonicalIncompleteWarning && (
            <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              Canonical journey metadata is incomplete for this day. Showing legacy fallback flow.
            </div>
          )}
          <div className="reading-section">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
              <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-white">
                {copy.journey.lesson.dayLabel} {lesson.day_number}
              </span>
            </div>

            <div className="mt-5 md:mt-6">
              <span
                className={`inline-block rounded-full bg-[var(--color-bg)] px-3 py-1 text-[var(--color-primary)] ${isUrduTopic ? 'font-urdu text-sm' : 'text-xs'}`}
                dir={isUrduTopic ? 'rtl' : 'ltr'}
                data-script-direction={isUrduTopic ? 'rtl' : 'ltr'}
              >
                {lesson.topic}
              </span>
              <h1
                className={`mt-4 font-semibold tracking-[-0.02em] text-[var(--color-text)] ${isUrduTitle ? 'font-urdu text-[30px] md:text-[48px] leading-[1.95]' : 'text-[29px] md:text-[42px] leading-[1.22]'}`}
                dir={isUrduTitle ? 'rtl' : 'ltr'}
                data-script-direction={isUrduTitle ? 'rtl' : 'ltr'}
              >
                {lesson.title}
              </h1>
              {lesson.subtitle && (
                <p
                  className={`mt-3 max-w-2xl text-[var(--color-text-muted)] ${isUrduSubtitle ? 'font-urdu text-[17px] md:text-[20px] leading-[2.2]' : 'text-[16px] md:text-[18px] leading-[1.95]'}`}
                  dir={isUrduSubtitle ? 'rtl' : 'ltr'}
                  data-script-direction={isUrduSubtitle ? 'rtl' : 'ltr'}
                >
                  {lesson.subtitle}
                </p>
              )}
            </div>

            <div className="mt-8 h-px bg-[var(--color-accent)]/25" />
          </div>

          {lesson.description && (
            <div className="reading-section">
              <h2 className="section-heading">{copy.journey.lesson.beforeYouBegin}</h2>
              <p
                className={`text-[var(--color-text)] ${isUrduDescription ? 'reading-prose-urdu' : 'reading-prose'}`}
                dir={isUrduDescription ? 'rtl' : 'ltr'}
                data-script-direction={isUrduDescription ? 'rtl' : 'ltr'}
              >
                {lesson.description}
              </p>
            </div>
          )}

          {shouldShowLanguageFallback && (
            <div className="mb-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
              <p className="text-sm text-[var(--color-text)]">{copy.journey.lesson.translationFallbackTitle}</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{copy.journey.lesson.translationFallbackDescription}</p>
            </div>
          )}

          <Suspense fallback={<VerseSectionSkeleton />}>
            <StreamSectionLogger name="VerseContent">
              <VerseContent 
                verseKeys={lesson.verse_keys} 
                translationId={translationId}
              />
            </StreamSectionLogger>
          </Suspense>

          {tafsirId && lesson.verse_keys.length > 0 && (
            <Suspense fallback={<TafsirSectionSkeleton />}>
              <StreamSectionLogger name="TafsirContent">
                <JourneyTafsirStreaming 
                  verseKeys={lesson.verse_keys}
                  tafsirId={tafsirId}
                />
              </StreamSectionLogger>
            </Suspense>
          )}

          {lesson.lesson_text && (
            <LessonTextContent lessonText={lesson.lesson_text} />
          )}

          {blocks && blocks.length > 0 && (
            <BlockContent blocks={blocks} translationId={translationId} />
          )}

          <Suspense fallback={<HadithSectionSkeleton />}>
            <StreamSectionLogger name="HadithContent">
              <HadithContent 
                lesson={lesson}
                hadithLanguage={hadithLanguage}
              />
            </StreamSectionLogger>
          </Suspense>

          <Suspense fallback={<ReflectionSectionSkeleton />}>
            <StreamSectionLogger name="ReflectionContent">
              <ReflectionContent 
                lesson={lesson}
                initialReflection={initialReflection}
              />
            </StreamSectionLogger>
          </Suspense>

          <Suspense fallback={<CompleteButtonSkeleton />}>
            <StreamSectionLogger name="CompleteButton">
              <CompleteButton 
                lessonId={lesson.id}
                dayNumber={lesson.day_number}
                isCompleted={isCompleted}
              />
            </StreamSectionLogger>
          </Suspense>
        </>
      )}

      <AudioPlayer />
    </div>
  );
}

function VerseContent({ verseKeys, translationId }: { verseKeys: string[]; translationId: number }) {
  const { JourneyVerseContentInner } = require('./journey-verse-content-inner');
  return <JourneyVerseContentInner verseKeys={verseKeys} translationId={translationId} />;
}

function LessonTextContent({ lessonText }: { lessonText: string | null }) {
  if (!lessonText) return null;
  
  const { LessonTextInner } = require('./journey-lesson-text-inner');
  return <LessonTextInner lessonText={lessonText} />;
}

interface VerseWithData {
  verse_key: string;
  text_uthmani: string;
  chapter_name?: string;
  translations?: Array<{ resource_name: string; text: string }>;
  audio_url?: string;
}

function BlockContent({ blocks, translationId }: { blocks?: LessonBlock[]; translationId: number }) {
  const [verseDataMap, setVerseDataMap] = useState<Record<string, VerseWithData>>({});
  const [loadingVerses, setLoadingVerses] = useState(false);
  const copy = useCopy();

  useEffect(() => {
    const verseBlocks = blocks?.filter(b => b.block_type === 'verse') || [];
    if (verseBlocks.length === 0) return;

    setLoadingVerses(true);
    
    const fetchVerses = async () => {
      const verseKeys = verseBlocks.map(b => b.content.verse_key as string).filter(Boolean);
      if (verseKeys.length === 0) return;

      try {
        const response = await fetch(`/api/verses?verse_keys=${verseKeys.join(',')}&translation=${translationId}`);
        if (response.ok) {
          const data = await response.json();
          const map: Record<string, VerseWithData> = {};
          (data.verses || []).forEach((v: { verse: VerseWithData; verseKey: string; chapterName?: string; audioUrl?: string }) => {
            if (v.verse) {
              map[v.verseKey] = {
                ...v.verse,
                chapter_name: v.chapterName,
                audio_url: v.audioUrl,
              };
            }
          });
          setVerseDataMap(map);
        }
      } catch (error) {
        console.error('Failed to fetch verses:', error);
      } finally {
        setLoadingVerses(false);
      }
    };

    fetchVerses();
  }, [blocks, translationId]);

  if (!blocks || blocks.length === 0) return null;
  
  return (
    <div className="space-y-7 md:space-y-8">
      {blocks.map((block, index) => {
        const content = block.content as Record<string, unknown>;
        
        switch (block.block_type) {
          case 'heading':
            const level = content.level as number || 2;
            const HeadingTag = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
             const headingClass = level === 1 ? 'mt-9 mb-4 text-2xl font-semibold leading-[1.3] text-[var(--color-text)]'
              : level === 2 ? 'mt-8 mb-3 text-xl font-medium leading-[1.35] text-[var(--color-text)]'
              : 'mt-6 mb-2 text-lg font-medium leading-[1.4] text-[var(--color-text)]';
            return <HeadingTag key={index} className={headingClass}>{content.text as string}</HeadingTag>;
            
          case 'paragraph':
            const text = content.text as string || '';
            const withBold = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            const withItalic = withBold.replace(/\*([^*]+)\*/g, '<em>$1</em>');
            const isUrduParagraph = /[\u0600-\u06FF]/.test(text);
            return (
              <p
                key={index}
                className={`text-[var(--color-text)] ${isUrduParagraph ? 'reading-prose-urdu' : 'reading-prose'}`}
                dir={isUrduParagraph ? 'rtl' : 'ltr'}
                data-script-direction={isUrduParagraph ? 'rtl' : 'ltr'}
                dangerouslySetInnerHTML={{ __html: withItalic }}
              />
            );
            
          case 'arabic':
            return (
              <p key={index} className="reading-arabic font-arabic text-[24px] md:text-[28px] text-right text-[var(--color-text)] my-4" dir="rtl">
                {content.text as string}
              </p>
            );
            
          case 'transliteration':
            const transText = content.text as string | undefined;
            const transTranslation = content.translation as string | undefined;
            return (
              <div key={index} className="my-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/80 p-5">
                {transText && (
                  <p className="text-[16px] italic text-[var(--color-text)] leading-[1.95] mb-3">
                    {transText}
                  </p>
                )}
                {transTranslation && (
                  <>
                    <div className="h-px bg-[var(--color-border)] my-3" />
                    <p className="text-[14px] text-[var(--color-text-muted)]">{transTranslation}</p>
                  </>
                )}
              </div>
            );
            
          case 'verse':
            const verseKey = content.verse_key as string | undefined;
            const verseData = verseKey ? verseDataMap[verseKey] : null;
            
            return (
              <div key={index} className="my-6 rounded-2xl border border-[var(--color-primary)]/18 bg-[var(--color-primary)]/5 p-5">
                {verseKey && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[var(--color-primary)] text-sm">✦</span>
                    <span className="text-sm font-medium text-[var(--color-primary)]">
                      {verseData?.chapter_name || 'Quran'} {verseKey}
                    </span>
                  </div>
                )}
                
                {verseData?.text_uthmani && (
                  <p className="reading-arabic font-arabic text-[20px] text-right text-[var(--color-text)] my-3" dir="rtl">
                    {verseData.text_uthmani}
                  </p>
                )}
                
                {verseData?.translations?.length ? (
                  <p className="text-[15px] text-[var(--color-text-muted)] mt-2 leading-[1.9]">
                    {verseData.translations[0].text}
                  </p>
                ) : loadingVerses ? (
                  <p className="text-[12px] text-[var(--color-text-muted)] mt-2">{copy.journey.lesson.loadingTranslation}</p>
                ) : null}
              </div>
            );
            
          case 'quote':
            const quoteText = content.text as string | undefined;
            const quoteSource = content.source as string | undefined;
            return (
              <div key={index} className="relative my-6">
                <span className="font-arabic text-[48px] text-[var(--color-accent)] absolute top-0 left-0 opacity-30" dir="rtl">"</span>
                <blockquote className="pl-8 pr-4 py-2">
                  {quoteText && (
                    <p className="text-[15px] italic leading-[1.9] text-[var(--color-text)]">
                      {quoteText}
                    </p>
                  )}
                  {quoteSource && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-2 text-right">
                      — {quoteSource}
                    </p>
                  )}
                </blockquote>
              </div>
            );
            
          case 'reflection':
            const prompts = content.prompts as string[] | undefined;
            if (!prompts || prompts.length === 0) return null;
            return (
              <div key={index} className="my-10 rounded-[28px] border border-[var(--color-accent)]/20 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-bg)] p-6 md:p-7">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-[var(--color-accent)]">{copy.journey.lesson.pauseReflect}</h3>
                </div>
                <div className="space-y-3">
                  {prompts.filter(Boolean).map((prompt, idx) => {
                    const isUrduPrompt = /[\u0600-\u06FF]/.test(prompt);
                    return (
                    <div key={idx} className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                      <span className="w-6 h-6 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium text-sm flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p
                        className={`text-[15px] text-[var(--color-text)] ${isUrduPrompt ? 'font-urdu text-[17px] leading-[2.15]' : 'leading-relaxed'}`}
                        dir={isUrduPrompt ? 'rtl' : 'ltr'}
                      >
                        {prompt}
                      </p>
                    </div>
                    );
                  })}
                </div>
              </div>
            );
            
          case 'list':
            const listItems = content.items as string[] | undefined;
            if (!listItems || listItems.length === 0) return null;
            return (
              <ul key={index} className="my-5 space-y-3">
                {listItems.filter(Boolean).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[16px] text-[var(--color-text)] leading-[1.9]">
                    <span className="text-[var(--color-accent)] mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
            
          default:
            return null;
        }
      })}
    </div>
  );
}

function HadithContent({
  lesson,
  hadithLanguage,
}: {
  lesson: LessonData;
  hadithLanguage?: 'auto' | 'english' | 'urdu';
}) {
  const { HadithContentInner } = require('./journey-hadith-inner');
  return <HadithContentInner lesson={lesson} preferredLanguage={hadithLanguage} />;
}

function ReflectionContent({ lesson, initialReflection }: { lesson: LessonData; initialReflection: string }) {
  const { ReflectionContentInner } = require('./journey-reflection-inner');
  return <ReflectionContentInner lesson={lesson} initialReflection={initialReflection} />;
}

function CompleteButton({ lessonId, dayNumber, isCompleted }: { lessonId: string; dayNumber: number; isCompleted: boolean }) {
  const { LessonCompleteButton } = require('./lesson-complete-button');
  return <LessonCompleteButton lessonId={lessonId} dayNumber={dayNumber} isCompleted={isCompleted} />;
}
