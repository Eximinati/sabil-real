'use client';

import Link from 'next/link';

interface TimelineProps {
  lessons: Array<{
    id: string;
    day_number: number;
    title: string;
    topic: string;
  }>;
  progress: Array<{
    lesson_id: string;
    day_number: number;
    status: 'not_started' | 'in_progress' | 'completed';
  }>;
  currentDay: number;
}

export function JourneyTimeline({ lessons, progress, currentDay }: TimelineProps) {
  const getStatus = (lessonId: string, dayNumber: number) => {
    const p = progress.find(p => p.lesson_id === lessonId);
    if (p) return p.status;
    if (dayNumber < currentDay) return 'completed';
    if (dayNumber === currentDay) return 'current';
    return 'locked';
  };

  const completedCount = progress.filter(p => p.status === 'completed').length;
  const progressPercent = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--color-text)]">Your Journey</h3>
        <span className="text-sm text-[var(--color-text-muted)]">
          {completedCount} / {lessons.length} completed
        </span>
      </div>

      <div className="relative">
        <div className="absolute top-4 left-0 right-0 h-1 bg-[var(--color-border)] rounded-full" />
        <div 
          className="absolute top-4 left-0 h-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />

        <div className="flex justify-between relative pt-2">
          {lessons.slice(0, Math.min(lessons.length, 14)).map((lesson, index) => {
            const status = getStatus(lesson.id, lesson.day_number);
            const isActive = status === 'current';
            const isCompleted = status === 'completed';
            const isLocked = status === 'locked';

            return (
              <div key={lesson.id} className="flex flex-col items-center group relative">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    isCompleted 
                      ? 'bg-[var(--color-primary)] text-white' 
                      : isActive
                        ? 'bg-[var(--color-accent)] text-white ring-4 ring-[var(--color-accent)]/20'
                        : isLocked
                          ? 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
                          : 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    lesson.day_number
                  )}
                </div>

                <div className="absolute top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs whitespace-nowrap z-10 shadow-lg">
                  <p className="font-medium text-[var(--color-text)]">Day {lesson.day_number}</p>
                  <p className="text-[var(--color-text-muted)]">{lesson.topic}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {lessons.length > 14 && (
        <p className="text-xs text-center text-[var(--color-text-muted)] mt-4">
          + {lessons.length - 14} more lessons
        </p>
      )}
    </div>
  );
}