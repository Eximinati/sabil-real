'use client';

import { useState, useRef, useCallback, useEffect, memo } from 'react';

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

const ITEM_HEIGHT = 140;
const BUFFER_SIZE = 3;

export function VirtualizedTimeline({ 
  lessons, 
  progress, 
  currentDay,
  itemsPerPage = 10 
}: VirtualizedTimelineProps) {
  const [visibleStart, setVisibleStart] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      const height = containerRef.current.clientHeight;
      setContainerHeight(height || 600);
    }
  }, []);

  const totalItems = lessons.length;
  const visibleCount = Math.min(itemsPerPage, totalItems);
  const totalHeight = totalItems * ITEM_HEIGHT;
  const scrollTop = visibleStart * ITEM_HEIGHT;

  const getProgressForLesson = useCallback((lessonId: string) => {
    return progress.find(p => p.lesson_id === lessonId);
  }, [progress]);

  const isLessonUnlocked = useCallback((lesson: Lesson) => {
    if (lesson.day_number === 1) return true;
    const prevLesson = lessons.find(l => l.day_number === lesson.day_number - 1);
    if (!prevLesson) return true;
    const prevProgress = getProgressForLesson(prevLesson.id);
    return prevProgress?.status === 'completed';
  }, [lessons, getProgressForLesson]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const newStart = Math.floor(scrollTop / ITEM_HEIGHT);
    const maxStart = Math.max(0, totalItems - visibleCount);
    const clampedStart = Math.min(newStart, maxStart);
    
    if (clampedStart !== visibleStart) {
      setVisibleStart(clampedStart);
    }
  }, [visibleStart, totalItems, visibleCount]);

  const visibleLessons = lessons.slice(
    Math.max(0, visibleStart - BUFFER_SIZE),
    Math.min(totalItems, visibleStart + visibleCount + BUFFER_SIZE)
  );

  return (
    <div 
      ref={containerRef}
      className="relative overflow-auto max-h-[600px]"
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div 
          style={{ 
            transform: `translateY(${Math.max(0, (visibleStart - BUFFER_SIZE) * ITEM_HEIGHT)}px)` 
          }}
          className="space-y-4"
        >
          {visibleLessons.map((lesson) => {
            const lessonProgress = getProgressForLesson(lesson.id);
            const status = lessonProgress?.status || 'not_started';
            const unlocked = isLessonUnlocked(lesson);

            return (
              <div
                key={lesson.id}
                className={`bg-[var(--color-surface)] border rounded-xl p-4 md:p-5 card-hover ${
                  !unlocked ? 'opacity-60 cursor-not-allowed' : 'hover:border-[var(--color-primary)] border-[var(--color-border)]'
                }`}
                style={{ height: ITEM_HEIGHT - 16 }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 h-full">
                  <div className="flex items-center gap-4">
                    <span className={`w-9 h-9 md:w-[36px] md:h-[36px] flex items-center justify-center rounded-full text-sm font-medium flex-shrink-0 ${
                      status === 'completed' 
                        ? 'bg-[var(--color-primary)] text-white' 
                        : status === 'in_progress'
                          ? 'bg-[var(--color-accent)] text-white'
                          : unlocked
                            ? 'bg-[var(--color-accent)] text-white'
                            : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
                    }`}>
                      {status === 'completed' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        lesson.day_number
                      )}
                    </span>
                    <div>
                      <h3 className={`font-medium ${status === 'completed' ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}>
                        {lesson.title}
                      </h3>
                      {lesson.subtitle && (
                        <p className="text-sm text-[var(--color-text-muted)]">{lesson.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:gap-4 ml-13 md:ml-0">
                    {unlocked ? (
                      <>
                        <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          ~{lesson.estimated_minutes} min
                        </span>
                        {status === 'completed' ? (
                          <span className="text-sm text-[var(--color-primary)]">Review</span>
                        ) : status === 'in_progress' ? (
                          <a
                            href={`/journey/${lesson.day_number}`}
                            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm hover:bg-[var(--color-primary-hover)] transition-colors"
                          >
                            Continue →
                          </a>
                        ) : (
                          <a
                            href={`/journey/${lesson.day_number}`}
                            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm hover:bg-[var(--color-primary-hover)] transition-colors"
                          >
                            Begin →
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          ~{lesson.estimated_minutes} min
                        </span>
                        <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </>
                    )}
                  </div>
                </div>

                {unlocked && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-block px-2.5 py-1 bg-[var(--color-bg)] text-[var(--color-primary)] rounded text-xs">
                      {lesson.topic}
                    </span>
                    {status === 'in_progress' && (
                      <span className="px-2.5 py-1 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded text-xs font-medium">
                        In Progress
                      </span>
                    )}
                    {status === 'completed' && (
                      <span className="px-2.5 py-1 bg-[var(--color-primary)] text-white rounded text-xs">
                        Completed
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {totalItems > visibleCount && (
        <div className="sticky bottom-0 bg-[var(--color-bg)] border-t border-[var(--color-border)] py-2 text-center text-sm text-[var(--color-text-muted)]">
          Showing {visibleStart + 1}-{Math.min(visibleStart + visibleCount, totalItems)} of {totalItems} lessons
          <button 
            onClick={() => setVisibleStart(0)}
            className="ml-2 text-[var(--color-primary)] hover:underline"
          >
            Top
          </button>
        </div>
      )}
    </div>
  );
}

export const JourneyTimelineVirtualized = memo(VirtualizedTimeline);
JourneyTimelineVirtualized.displayName = 'JourneyTimelineVirtualized';