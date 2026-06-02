'use client';

import { useState, useMemo } from 'react';
import { useReflection } from '@/lib/reflection-context';
import { useLanguage } from '@/lib/i18n/context';

interface SectionProgress {
  id: 'lesson-content' | 'reflection' | 'completion';
  labelEn: string;
  labelUr: string;
  exists: boolean;
  progress: number;
  weight: number;
}

interface GlobalJourneyProgressProps {
  status: 'not_started' | 'in_progress' | 'completed';
  hasReflectionSection: boolean;
  lessonTitle: string;
  dayNumber: number;
}

const WEIGHT_LESSON = 40;
const WEIGHT_REFLECTION = 30;
const WEIGHT_COMPLETION = 10;

export function GlobalJourneyProgress({
  status,
  hasReflectionSection,
  lessonTitle,
  dayNumber,
}: GlobalJourneyProgressProps) {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';
  const { text: reflectionText } = useReflection();
  const [expanded, setExpanded] = useState(false);

  const sections: SectionProgress[] = useMemo(() => {
    const isStarted = status === 'in_progress' || status === 'completed';
    const isCompleted = status === 'completed';
    const hasSavedReflection = reflectionText.trim().length > 0;

    return [
      {
        id: 'lesson-content',
        labelEn: 'Lesson Content',
        labelUr: 'سبق کا مواد',
        exists: true,
        progress: isStarted ? 100 : 0,
        weight: WEIGHT_LESSON,
      },
      {
        id: 'reflection',
        labelEn: 'Reflection',
        labelUr: 'تامل',
        exists: hasReflectionSection,
        progress: hasSavedReflection ? 100 : 0,
        weight: WEIGHT_REFLECTION,
      },
      {
        id: 'completion',
        labelEn: 'Completion',
        labelUr: 'تکمیل',
        exists: true,
        progress: isCompleted ? 100 : 0,
        weight: WEIGHT_COMPLETION,
      },
    ];
  }, [status, reflectionText, hasReflectionSection]);

  const totalProgress = useMemo(() => {
    const available = sections.filter((s) => s.exists);
    const totalWeight = available.reduce((sum, s) => sum + s.weight, 0);
    if (totalWeight === 0) return 0;

    return Math.round(
      available.reduce((sum, s) => sum + (s.progress * s.weight) / totalWeight, 0)
    );
  }, [sections]);

  const sectionLabel = (s: SectionProgress) => (isUrdu ? s.labelUr : s.labelEn);
  const progressLabel = isUrdu ? 'مکمل' : 'Complete';
  const dayLabel = isUrdu ? 'دن' : 'Day';

  return (
    <div
      className="sticky top-0 z-30 -mx-4 px-4 md:-mx-6 md:px-6 pt-3 pb-2 bg-[var(--color-bg)]/92 backdrop-blur-md border-b border-[var(--color-border)]/60"
      role="progressbar"
      aria-valuenow={totalProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={isUrdu ? `پیش رفت: ${totalProgress}%` : `Progress: ${totalProgress}%`}
    >
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-lg"
        aria-expanded={expanded}
        aria-label={isUrdu
          ? `پیش رفت ${totalProgress}%۔ مزید تفصیل کے لیے کلک کریں`
          : `Progress ${totalProgress}%. Click for details`}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-medium text-[var(--color-text-muted)] truncate">
            {dayLabel} {dayNumber} &bull; {lessonTitle}
          </span>
          <span className="text-xs font-semibold text-[var(--color-primary)] shrink-0">
            {totalProgress}%
          </span>
        </div>

        <div className="w-full h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all duration-500 ease-out"
            style={{ width: `${totalProgress}%` }}
          />
        </div>

        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
          {totalProgress}% {progressLabel}
        </p>
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5 pb-1">
          {sections
            .filter((s) => s.exists)
            .map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-xs">
                <span className="w-28 shrink-0 text-[var(--color-text-muted)] truncate">
                  {sectionLabel(s)}
                </span>
                <div className="flex-1 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)]/70 transition-all duration-500 ease-out"
                    style={{ width: `${s.progress}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[var(--color-text-muted)] shrink-0">
                  {s.progress}%
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
