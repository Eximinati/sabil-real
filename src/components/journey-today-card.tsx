'use client';

import { useState, useEffect } from 'react';
import { JourneyTranslationSelector } from './journey-translation-selector';
import { JourneyReciterSelector } from './journey-reciter-selector';

interface JourneyTodayCardProps {
  currentDay: number;
  totalDays: number;
  completedDays: number;
  streak?: number;
  currentLesson?: {
    day_number: number;
    title: string;
    subtitle?: string | null;
    topic: string;
    estimated_minutes: number;
  };
  nextLessonHref?: string;
  isCompletedToday?: boolean;
}

const STORAGE_KEY = 'sabil-last-visit';

export function JourneyTodayCard({
  currentDay,
  totalDays,
  completedDays,
  streak = 0,
  currentLesson,
  nextLessonHref,
  isCompletedToday = false,
}: JourneyTodayCardProps) {
  const [selectedTranslation, setSelectedTranslation] = useState(203);
  const [selectedReciter, setSelectedReciter] = useState(5);
  const [timeGreeting, setTimeGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeGreeting('Good morning');
    else if (hour < 17) setTimeGreeting('Good afternoon');
    else setTimeGreeting('Good evening');

    const storedTranslation = localStorage.getItem('sabil-translation-id');
    if (storedTranslation) setSelectedTranslation(parseInt(storedTranslation, 10));

    const storedReciter = localStorage.getItem('sabil-reciter-id');
    if (storedReciter) setSelectedReciter(parseInt(storedReciter, 10));

    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  }, []);

  const progressPercent = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  const handleTranslationChange = (id: number) => {
    setSelectedTranslation(id);
    localStorage.setItem('sabil-translation-id', id.toString());
    window.location.reload();
  };

  const handleReciterChange = (id: number) => {
    setSelectedReciter(id);
    localStorage.setItem('sabil-reciter-id', id.toString());
  };

  return (
    <div className="relative bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-surface)] to-[var(--color-primary-light)] border border-[var(--color-border)] rounded-2xl p-6 mb-8 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-accent-light),transparent_50%)] opacity-60 pointer-events-none" />
      <div className="relative z-10">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm text-[var(--color-text-muted)]">{timeGreeting}</span>
            <span className="text-[var(--color-text-muted)]">•</span>
            <span className="text-xs text-[var(--color-text-muted)] font-medium">Day {currentDay} of {totalDays}</span>
            {streak > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-accent)]/15 rounded-full border border-[var(--color-accent)]/20">
                <span className="text-sm">🔥</span>
                <span className="text-sm font-medium text-[var(--color-accent)]">{streak}</span>
              </span>
            )}
          </div>

          {currentLesson && !isCompletedToday ? (
            <div>
              <p className="text-sm text-[var(--color-text-muted)] mb-1">Today&apos;s Transformation</p>
              <h2 className="text-2xl md:text-3xl font-semibold text-[var(--color-text)]">
                {currentLesson.title}
              </h2>
              {currentLesson.subtitle && (
                <p className="text-[var(--color-text-secondary)] mt-1">{currentLesson.subtitle}</p>
              )}
              <div className="flex items-center gap-4 mt-3">
                <span className="inline-block px-2.5 py-1 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded text-xs font-medium border border-[var(--color-accent)]/20">
                  {currentLesson.topic}
                </span>
                <span className="flex items-center gap-1 text-sm text-[var(--color-text-muted)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ~{currentLesson.estimated_minutes} min
                </span>
              </div>
            </div>
          ) : isCompletedToday ? (
            <div>
              <p className="text-sm text-[var(--color-text-muted)] mb-1">Today&apos;s Transformation</p>
              <h2 className="text-2xl md:text-3xl font-semibold text-[var(--color-text)]">
                <span className="text-[var(--color-accent)]">Completed</span> ✓
              </h2>
              <p className="text-[var(--color-text-secondary)] mt-2">
                Your daily reflection has been recorded. Tomorrow brings new light.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold text-[var(--color-text)]">
                {completedDays === 0 ? "Begin Your Transformation" : "Continue Your Journey"}
              </h2>
              <p className="text-[var(--color-text-secondary)] mt-2">
                {completedDays === 0 
                  ? "One day at a time, one step closer to Allah."
                  : `${completedDays} day${completedDays > 1 ? 's' : ''} of transformation. Keep going!`}
              </p>
            </div>
          )}
        </div>

        {currentLesson && !isCompletedToday && nextLessonHref && (
          <a
            href={nextLessonHref}
            className="shrink-0 bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-all shadow-lg shadow-[var(--color-primary)]/25 flex items-center gap-2"
          >
            Begin Today&apos;s Lesson
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[var(--color-text-muted)]">Journey Progress</span>
          <span className="text-[var(--color-text)] font-medium">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--color-border)]">
        <JourneyTranslationSelector 
          currentTranslationId={selectedTranslation} 
          variant="header"
          onTranslationChange={handleTranslationChange}
        />
        <JourneyReciterSelector
          currentReciterId={selectedReciter}
          onReciterChange={handleReciterChange}
        />
      </div>
      </div>
    </div>
  );
}