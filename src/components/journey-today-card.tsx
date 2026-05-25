'use client';

import { useState, useEffect } from 'react';
import { useCopy, useI18nText } from '@/hooks/use-copy';

interface JourneyTodayCardProps {
  currentDay: number;
  currentLesson?: {
    day_number: number;
    title: string;
    subtitle?: string | null;
    topic: string;
    estimated_minutes: number;
  };
  nextLessonHref?: string;
  weekChapter?: string;
  emotionalNote?: string;
}

const QUIET_AYAH = {
  arabic: 'اَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
};

export function JourneyTodayCard({
  currentDay,
  currentLesson,
  nextLessonHref,
  weekChapter,
  emotionalNote,
}: JourneyTodayCardProps) {
  const [timeGreeting, setTimeGreeting] = useState('');
  const copy = useCopy();
  const { interpolate } = useI18nText();
  const subtitleText = currentLesson?.subtitle || copy.journey.todayCard.beginFallbackSubtitle;
  const isUrduSubtitle = /[\u0600-\u06FF]/.test(subtitleText);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeGreeting(copy.journey.todayCard.greetingMorning);
    else if (hour < 17) setTimeGreeting(copy.journey.todayCard.greetingAfternoon);
    else setTimeGreeting(copy.journey.todayCard.greetingEvening);
  }, [copy.journey.todayCard.greetingAfternoon, copy.journey.todayCard.greetingEvening, copy.journey.todayCard.greetingMorning]);

  return (
    <div className="relative mb-6 overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-surface)] to-[var(--color-primary-light)] p-5 md:p-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-accent-light),transparent_45%)] opacity-70 pointer-events-none" />
      <div className="relative z-10">
        <p className="text-sm text-[var(--color-text-muted)]">{timeGreeting}</p>

        <div className="mt-6 max-w-3xl">
            <p className="reading-arabic font-arabic text-[24px] md:text-[32px] text-[var(--color-accent)]" dir="rtl">
              {QUIET_AYAH.arabic}
            </p>
            <p className="mt-3 text-sm italic leading-relaxed text-[var(--color-text-muted)]">
              {copy.journey.todayCard.quietAyahTranslation}
            </p>
            <p className="mt-2 text-xs tracking-[0.02em] text-[var(--color-text-subtle)]">
              {copy.journey.todayCard.quietAyahReference}
            </p>
          </div>

        <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-3 py-1.5">
            {copy.common.labels.day} {currentDay}
          </span>
          {weekChapter && (
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-3 py-1.5">
              {weekChapter}
            </span>
          )}
          {emotionalNote && (
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-3 py-1.5 capitalize">
              {emotionalNote}
            </span>
          )}
          {currentLesson && (
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {interpolate(copy.journey.todayCard.aboutQuietMinutes, {
                minutes: currentLesson.estimated_minutes,
              })}
            </span>
          )}
        </div>

        <div className="mt-7 max-w-3xl">
          <p className="text-sm text-[var(--color-text-muted)]">{copy.journey.todayCard.todayGuidedExperience}</p>
          <h1 className="mt-3 text-[30px] md:text-[46px] font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--color-text)]">
            {currentLesson?.title || copy.journey.todayCard.beginFallbackTitle}
          </h1>
          <p
            className={`mt-3 max-w-2xl text-[var(--color-text-secondary)] ${isUrduSubtitle ? 'font-urdu text-[17px] md:text-[20px] leading-[2.2]' : 'text-[16px] md:text-[18px] leading-[1.95]'}`}
            dir={isUrduSubtitle ? 'rtl' : 'ltr'}
            data-script-direction={isUrduSubtitle ? 'rtl' : 'ltr'}
          >
            {subtitleText}
          </p>
          {currentLesson?.topic && (
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {copy.journey.todayCard.topicIntro} {currentLesson.topic.toLowerCase()}.
            </p>
          )}
        </div>

        {nextLessonHref && (
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <a
              href={nextLessonHref}
              className="quiet-controls inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--color-primary-hover)]"
            >
              {copy.common.actions.continueGently}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <p className="max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
              {copy.journey.todayCard.ctaSupportiveLine}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
