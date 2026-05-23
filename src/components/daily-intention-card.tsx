'use client';

import { useState } from 'react';

const REFLECTION_QUESTIONS = [
  "What currently holds the most control over your heart besides Allah?",
  "Where in your life do you struggle to trust Allah's plan?",
  "What is one thing you can surrender to Allah today?",
  "Which of Allah's names do you need to remember more?",
  "What旧 habit is preventing you from growing closer to Allah?",
  "In what way can you serve others more intentionally today?",
  "Where have you been holding onto control instead of tawakkul?",
  "What gratitude can you express to Allah right now?",
  "What is one area where you've forgotten your relationship with Allah?",
  "How can you be more present in your worship today?",
];

function getDailyQuestion(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return REFLECTION_QUESTIONS[dayOfYear % REFLECTION_QUESTIONS.length];
}

interface DailyIntentionCardProps {
  nextLessonDay?: number;
}

export function DailyIntentionCard({ nextLessonDay = 1 }: DailyIntentionCardProps) {
  const [question] = useState(() => getDailyQuestion());

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
            <p className="text-sm text-[var(--color-text-muted)]">Carry this intention today</p>
            <p className="mt-3 text-[17px] md:text-[20px] leading-[1.9] text-[var(--color-text)]">
              {question}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-[var(--color-text-muted)]">Let it stay with you as you read.</span>
              <span className="text-[var(--color-primary)] transition-colors group-hover:text-[var(--color-primary-hover)]">
                Open day {nextLessonDay}
              </span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
