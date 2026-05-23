'use client';

import { useState, useEffect } from 'react';

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
}

const QUIET_AYAH = {
  arabic: 'اَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
  translation: 'Surely, in the remembrance of Allah do hearts find rest.',
  reference: 'Quran 13:28',
};

export function JourneyTodayCard({
  currentDay,
  currentLesson,
  nextLessonHref,
}: JourneyTodayCardProps) {
  const [timeGreeting, setTimeGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeGreeting('Good morning');
    else if (hour < 17) setTimeGreeting('Good afternoon');
    else setTimeGreeting('Good evening');
  }, []);

  return (
    <div className="relative mb-6 overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-surface)] to-[var(--color-primary-light)] p-6 md:p-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-accent-light),transparent_45%)] opacity-70 pointer-events-none" />
      <div className="relative z-10">
        <p className="text-sm text-[var(--color-text-muted)]">{timeGreeting}</p>

        <div className="mt-6 max-w-3xl">
          <p className="font-arabic text-[24px] md:text-[32px] leading-[1.9] text-[var(--color-accent)]" dir="rtl">
            {QUIET_AYAH.arabic}
          </p>
          <p className="mt-3 text-sm italic leading-relaxed text-[var(--color-text-muted)]">
            {QUIET_AYAH.translation}
          </p>
          <p className="mt-2 text-xs tracking-[0.02em] text-[var(--color-text-subtle)]">
            {QUIET_AYAH.reference}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-3 py-1.5">
            Day {currentDay}
          </span>
          {currentLesson && (
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              About {currentLesson.estimated_minutes} quiet minutes
            </span>
          )}
        </div>

        <div className="mt-8 max-w-3xl">
          <p className="text-sm text-[var(--color-text-muted)]">Today&apos;s guided experience</p>
          <h1 className="mt-3 text-[32px] md:text-[46px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--color-text)]">
            {currentLesson?.title || 'Begin gently'}
          </h1>
          <p className="mt-3 max-w-2xl text-[16px] md:text-[18px] leading-[1.9] text-[var(--color-text-secondary)]">
            {currentLesson?.subtitle || 'Take one calm step toward Allah today. The journey does not need to be rushed.'}
          </p>
          {currentLesson?.topic && (
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
              Today you will sit with {currentLesson.topic.toLowerCase()}.
            </p>
          )}
        </div>

        {nextLessonHref && (
          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <a
              href={nextLessonHref}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-medium text-white transition-all hover:bg-[var(--color-primary-hover)]"
            >
              Continue gently
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <p className="max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
              You do not need to finish everything at once. Let today be enough for today.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
