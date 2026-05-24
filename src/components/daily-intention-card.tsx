'use client';

import { useState } from 'react';
import { useCopy, useI18nText } from '@/hooks/use-copy';

function getDailyQuestion(questions: string[]): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  if (questions.length === 0) return '';
  return questions[dayOfYear % questions.length];
}

interface DailyIntentionCardProps {
  nextLessonDay?: number;
}

export function DailyIntentionCard({ nextLessonDay = 1 }: DailyIntentionCardProps) {
  const copy = useCopy();
  const { interpolate } = useI18nText();
  const [question] = useState(() => getDailyQuestion(copy.journey.dailyIntention.reflectionQuestions));

  return (
    <a 
      href={`/journey/${nextLessonDay}`}
      className="group relative mb-8 block overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]/85 p-6 md:p-7 transition-colors hover:border-[var(--color-accent)]/35"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(212,175,55,0.04),transparent_60%)]" />
      <div className="relative">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/10 transition-colors group-hover:bg-[var(--color-accent)]/15">
            <svg className="h-5 w-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-[var(--color-text-muted)]">{copy.journey.dailyIntention.title}</p>
            <p className="mt-3 text-[17px] md:text-[20px] leading-[1.9] text-[var(--color-text)]">
              {question}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-[var(--color-text-muted)]">{copy.journey.dailyIntention.supportiveLine}</span>
              <span className="text-[var(--color-primary)] transition-colors group-hover:text-[var(--color-primary-hover)]">
                {interpolate(`${copy.common.labels.openDay} {day}`, { day: nextLessonDay })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
