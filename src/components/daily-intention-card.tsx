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
      className="block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 mb-6 overflow-hidden relative hover:border-[var(--color-accent)]/40 transition-colors group"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(212,175,55,0.04),transparent_60%)]" />
      <div className="relative">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0 group-hover:bg-[var(--color-accent)]/20 transition-colors">
            <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-[var(--color-text)] font-medium text-sm mb-1 flex items-center gap-2">
              Today&apos;s Reflection
              <svg className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </h3>
            <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
              {question}
            </p>
          </div>
        </div>
      </div>
    </a>
  );
}