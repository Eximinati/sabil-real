'use client';

import Link from 'next/link';
import { JourneyVerseContentInner } from './journey-verse-content-inner';
import { JourneyTafsirStreaming } from './journey-tafsir-streaming';
import { ReflectionInput } from './reflection-input';
import { LessonCompleteButton } from './lesson-complete-button';
import { HadithContentInner } from './journey-hadith-inner';
import { useLanguage } from '@/lib/i18n/context';
import type {
  CanonicalJourneySectionId,
  CanonicalTafsirRevealMode,
} from '@/types/journey-localization';

interface DayOneCanonicalExperienceProps {
  lessonId: string;
  dayNumber: number;
  lessonTitle?: string;
  lessonSubtitle?: string | null;
  translationId: number;
  tafsirId?: number;
  canonicalVerseKeys?: string[];
  quranRangeLabel?: string;
  quranIntroText?: string;
  openingReflectionText?: string;
  seerahMomentText?: string;
  tafsirInsightText?: string;
  reflectionPromptText?: string | null;
  tinyActionText?: string;
  closingDuaText?: string;
  hadithCollection?: string | null;
  hadithNumber?: number | null;
  hadithText?: string | null;
  hadithSource?: string | null;
  hadithLanguage?: 'auto' | 'english' | 'urdu';
  tafsirEnabled?: boolean;
  tafsirRevealMode?: CanonicalTafsirRevealMode;
  tafsirFallbackUsed?: boolean;
  sectionTitles?: Partial<Record<CanonicalJourneySectionId, string>>;
  initialReflection: string;
  isCompleted: boolean;
  hasNextDay?: boolean;
  previewOnly?: boolean;
  languageOverride?: 'en' | 'ur';
}

const FALLBACK_VERSES = ['96:1', '96:2', '96:3', '96:4', '96:5'];

const CONTENT_UNAVAILABLE = 'Content not yet available for this section.';
const CONTENT_UNAVAILABLE_UR = 'اس حصے کے لیے مواد ابھی دستیاب نہیں ہے۔';

const SECTION_DEFAULT_TITLES: Record<CanonicalJourneySectionId, string> = {
  'opening-reflection': 'Opening reflection',
  'seerah-moment': 'Seerah moment',
  'quran-reflection': 'Quran reflection',
  'tafsir-insight': 'Tafsir framing',
  'hadith-connection': 'Hadith connection',
  'reflection-prompt': 'Reflection prompt',
  'tiny-action': 'Tiny action',
  'closing-dua': 'Closing dua',
};

const SECTION_URDU_TITLES: Record<CanonicalJourneySectionId, string> = {
  'opening-reflection': 'ابتدائی تامل',
  'seerah-moment': 'سیرت کا لمحہ',
  'quran-reflection': 'قرآنی تامل',
  'tafsir-insight': 'تفسیری فریمنگ',
  'hadith-connection': 'حدیثی ربط',
  'reflection-prompt': 'تاملی سوال',
  'tiny-action': 'چھوٹا عمل',
  'closing-dua': 'اختتامی دعا',
};

function toParagraphs(text?: string | null): string[] {
  if (!text) {
    return [];
  }

  return text
    .replace(/\r\n/g, '\n')
    .split('\n\n')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => part.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((part) => !/^\d{1,3}:\d{1,3}(\s+\d{1,3}:\d{1,3})*$/.test(part));
}

function firstParagraph(text?: string | null): string | null {
  const paragraphs = toParagraphs(text);
  return paragraphs[0] || null;
}

function normalizeVerseKeys(verseKeys: string[]): string[] {
  return Array.from(new Set(verseKeys.filter(Boolean)));
}

export function DayOneCanonicalExperience({
  lessonId,
  dayNumber,
  lessonTitle,
  lessonSubtitle,
  translationId,
  tafsirId,
  canonicalVerseKeys,
  quranRangeLabel,
  quranIntroText,
  openingReflectionText,
  seerahMomentText,
  tafsirInsightText,
  reflectionPromptText,
  tinyActionText,
  closingDuaText,
  hadithCollection,
  hadithNumber,
  hadithText,
  hadithSource,
  hadithLanguage,
  tafsirEnabled = true,
  tafsirRevealMode = 'condensed',
  tafsirFallbackUsed = false,
  sectionTitles,
  initialReflection,
  isCompleted,
  hasNextDay,
  previewOnly = false,
  languageOverride,
}: DayOneCanonicalExperienceProps) {
  const { language } = useLanguage();
  const resolvedLanguage = languageOverride || language;
  const isUrduUi = resolvedLanguage === 'ur';
  const verseKeys = normalizeVerseKeys(
    canonicalVerseKeys && canonicalVerseKeys.length > 0 ? canonicalVerseKeys : FALLBACK_VERSES
  );
  const nextDayHref = hasNextDay
    ? `/journey/${dayNumber + 1}`
    : '/journey?notice=return-tomorrow';

  const unavailable = isUrduUi ? CONTENT_UNAVAILABLE_UR : CONTENT_UNAVAILABLE;

  const copy = isUrduUi
    ? {
        dayPrefix: 'دن',
        scholarContextHeading: 'اگر علمی سیاق مدد دے',
        scholarContextHint: 'یہ آپ کے محفوظ کردہ مفسر کے مطابق دکھایا جاتا ہے۔',
        scholarFallbackHint: 'آپ کے پسندیدہ مفسر کی جگہ متبادل علمی سیاق دکھایا گیا۔',
        continueLineHasNext: 'اگر دل ذرا نرم ہوا ہے تو کل بھی واپس آئیے۔',
        continueLineNoNext: 'اگر دل ذرا نرم ہوا ہے تو آج کے سفر پر نرمی سے لوٹتے رہیں۔',
        continueLinkHasNext: 'اگلا دن خاموشی سے آپ کا منتظر ہے۔',
        continueLinkNoNext: 'آج کے سفر پر واپس جائیں۔',
      }
    : {
        dayPrefix: 'Day',
        scholarContextHeading: 'If you want scholar context',
        scholarContextHint: 'Open only if it helps your heart stay present.',
        scholarFallbackHint: 'Your selected scholar was unavailable, so a gentle fallback context is shown.',
        continueLineHasNext: 'If your heart feels even a little softer now, return tomorrow.',
        continueLineNoNext:
          'If your heart feels even a little softer now, keep returning gently to this day.',
        continueLinkHasNext: 'Your next day is waiting quietly.',
        continueLinkNoNext: 'Return to today\'s journey.',
      };
  const arrivalAyahTranslationId = translationId;

  const titleFor = (id: CanonicalJourneySectionId): string => {
    const planned = sectionTitles?.[id];

    if (isUrduUi) {
      if (planned && /[\u0600-\u06FF]/.test(planned)) {
        return planned;
      }

      return SECTION_URDU_TITLES[id];
    }

    if (planned && !/[\u0600-\u06FF]/.test(planned)) {
      return planned;
    }

    return SECTION_DEFAULT_TITLES[id];
  };

  const openingParagraphs = toParagraphs(openingReflectionText);
  const seerahParagraphs = toParagraphs(seerahMomentText);
  const tafsirParagraphs = toParagraphs(tafsirInsightText);
  const resolvedReflectionPrompt = firstParagraph(reflectionPromptText) ||
    unavailable;
  const resolvedTinyAction = firstParagraph(tinyActionText) ||
    unavailable;
  const resolvedClosing = firstParagraph(closingDuaText) ||
    unavailable;
  const shouldShowArrivalCard = dayNumber === 1;

  return (
    <div className="space-y-10 md:space-y-14">
      <section className="reading-section pt-2 md:pt-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          {copy.dayPrefix} {dayNumber}
        </p>
        <h1 className="mt-3 text-[29px] font-semibold leading-[1.24] tracking-[-0.02em] text-[var(--color-text)] md:text-[44px]">
          {lessonTitle || `${copy.dayPrefix} ${dayNumber}`}
        </h1>
        {lessonSubtitle && (
          <p className="mt-4 max-w-2xl text-[16px] leading-[2] text-[var(--color-text-secondary)] md:text-[18px]">
            {lessonSubtitle}
          </p>
        )}

        {shouldShowArrivalCard && (
            <div className="mt-10 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]/85 px-6 py-7 md:px-8 md:py-9">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">A quiet ayah for arrival</p>
            <p className="reading-arabic mt-5 font-arabic text-right text-[30px] text-[var(--color-text)] md:text-[38px]" dir="rtl">
              مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَى
            </p>
            <div className="mt-5">
              <JourneyVerseContentInner
                key={`arrival-ayah-${arrivalAyahTranslationId}`}
                verseKeys={['93:3']}
                translationId={arrivalAyahTranslationId}
              />
            </div>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Surah Ad-Duha 93:3</p>
          </div>
        )}
      </section>

      {openingParagraphs.length > 0 && (
        <section className="reading-section max-w-3xl">
          <h2 className="section-heading">{titleFor('opening-reflection')}</h2>
          <div className="space-y-5 text-[16px] leading-[2] text-[var(--color-text)]">
            {openingParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      )}

      {seerahParagraphs.length > 0 && (
        <section className="reading-section rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-6 py-7 md:px-8 md:py-8">
          <h2 className="section-heading">{titleFor('seerah-moment')}</h2>
          {seerahParagraphs.map((paragraph, index) => (
            <p
              key={paragraph}
              className={`text-[16px] leading-[2] ${index === 2 ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text)]'} ${index > 0 ? 'mt-5' : ''}`}
            >
              {paragraph}
            </p>
          ))}
        </section>
      )}

      <section className="reading-section">
        <JourneyVerseContentInner
          key={`quran-verses-${translationId}`}
          verseKeys={verseKeys}
          translationId={translationId}
          title={titleFor('quran-reflection')}
          intro={quranIntroText || unavailable}
          referenceLabel={quranRangeLabel}
        />
      </section>

      {tafsirParagraphs.length > 0 && (
        <section className="reading-section max-w-3xl">
          <h2 className="section-heading">{titleFor('tafsir-insight')}</h2>
          <div className="space-y-5 text-[16px] leading-[2] text-[var(--color-text)]">
            {tafsirParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      )}

      {tafsirEnabled && tafsirId && (
        <section className="reading-section">
          <h2 className="section-heading">{copy.scholarContextHeading}</h2>
          <p className="mb-5 text-[15px] leading-[1.9] text-[var(--color-text-muted)]">
            {copy.scholarContextHint}
          </p>
          {tafsirFallbackUsed && (
            <p className="mb-5 text-xs text-[var(--color-text-muted)]">{copy.scholarFallbackHint}</p>
          )}
          <JourneyTafsirStreaming
            verseKeys={verseKeys}
            tafsirId={tafsirId}
            initialRevealMode={tafsirRevealMode}
          />
        </section>
      )}

      <section className="reading-section">
        <HadithContentInner
          title={titleFor('hadith-connection')}
          lesson={{
            id: lessonId,
            day_number: dayNumber,
            title: '',
            subtitle: null,
            topic: '',
            description: null,
            verse_keys: verseKeys,
            lesson_text: null,
            hadith_text: hadithText || null,
            hadith_source: hadithSource || null,
            hadith_collection: hadithCollection || null,
            hadith_number: hadithNumber || null,
            reflection_prompt: null,
            estimated_minutes: 10,
          }}
          preferredLanguage={hadithLanguage}
        />
      </section>

      {resolvedReflectionPrompt !== unavailable && (
        <section className="reading-section">
          <h2 className="section-heading">{titleFor('reflection-prompt')}</h2>
          <div className="reflection-prompt-card">
            <p className="text-[16px] leading-[1.9] text-[var(--color-text)]">
              {resolvedReflectionPrompt}
            </p>
          </div>
          {previewOnly ? (
            <div className="mt-6 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-4 text-sm text-[var(--color-text-muted)]">
              {isUrduUi
                ? 'پیش نظارہ: یہاں ذاتی تامل کا اندراج محفوظ ہوتا ہے۔'
                : 'Preview: private reflection entry appears here.'}
            </div>
          ) : (
            <div className="mt-6">
              <ReflectionInput lessonId={lessonId} dayNumber={dayNumber} initialValue={initialReflection || ''} />
            </div>
          )}
        </section>
      )}

      {resolvedTinyAction !== unavailable && (
        <section className="reading-section rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]/82 px-6 py-7 md:px-8 md:py-8">
          <h2 className="section-heading">{titleFor('tiny-action')}</h2>
          <p className="text-[16px] leading-[1.95] text-[var(--color-text)]">
            {resolvedTinyAction}
          </p>
        </section>
      )}

      {resolvedClosing !== unavailable && (
        <section className="reading-section rounded-[30px] border border-[var(--color-border)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-bg)] px-6 py-8 md:px-9 md:py-10">
          <h2 className="section-heading">{titleFor('closing-dua')}</h2>
          <p className="text-[16px] leading-[1.95] text-[var(--color-text)]">
            {resolvedClosing}
          </p>
          <p className="mt-6 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {hasNextDay
              ? copy.continueLineHasNext
              : copy.continueLineNoNext}
            {' '}
            <Link
              href={nextDayHref}
              className="rtl-ready-arrow text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
              data-script-direction="ltr"
            >
              {hasNextDay ? copy.continueLinkHasNext : copy.continueLinkNoNext}
            </Link>
          </p>
        </section>
      )}

      {!previewOnly && (
        <LessonCompleteButton lessonId={lessonId} dayNumber={dayNumber} isCompleted={isCompleted} />
      )}
    </div>
  );
}
