'use client';

import { memo } from 'react';

interface Lesson {
  id: string;
  day_number: number;
  title: string;
  subtitle: string | null;
  topic: string;
  estimated_minutes: number;
}

interface UserProgress {
  lesson_id: string;
  day_number: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

interface VirtualizedTimelineProps {
  lessons: Lesson[];
  progress: UserProgress[];
  currentDay: number;
  itemsPerPage?: number;
}

export function VirtualizedTimeline({ 
  lessons, 
  progress, 
  currentDay,
}: VirtualizedTimelineProps) {
  const getProgressForLesson = (lessonId: string) => {
    return progress.find(p => p.lesson_id === lessonId);
  };

  return (
    <div className="space-y-3">
      {lessons.map((lesson) => {
        const lessonProgress = getProgressForLesson(lesson.id);
        const status = lessonProgress?.status || 'not_started';
        const isToday = lesson.day_number === currentDay;
        const actionLabel = isToday ? 'Continue' : status === 'completed' || status === 'in_progress' ? 'Return' : 'Open';

        return (
          <a
            key={lesson.id}
            href={`/journey/${lesson.day_number}`}
            className={`block rounded-2xl border p-4 md:p-5 transition-colors ${
              isToday
                ? 'border-[var(--color-primary)]/35 bg-[var(--color-primary)]/5'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/25'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
                  <span className={`rounded-full px-3 py-1 ${
                    isToday
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                  }`}>
                    Day {lesson.day_number}
                  </span>
                  {isToday && <span className="text-[var(--color-primary)]">Today</span>}
                </div>

                <h3 className="mt-3 text-lg font-medium text-[var(--color-text)]">{lesson.title}</h3>
                {lesson.subtitle && (
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">{lesson.subtitle}</p>
                )}
                <p className="mt-3 text-sm text-[var(--color-text-muted)]">{lesson.topic}</p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm text-[var(--color-text-muted)]">~{lesson.estimated_minutes} min</p>
                <p className="mt-3 text-sm text-[var(--color-primary)]">{actionLabel}</p>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

export const JourneyTimelineVirtualized = memo(VirtualizedTimeline);
JourneyTimelineVirtualized.displayName = 'JourneyTimelineVirtualized';
