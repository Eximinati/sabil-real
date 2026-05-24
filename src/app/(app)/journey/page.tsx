import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { getPublishedLessons, getUserProgress, UserProgress } from '@/lib/journey';
import { JourneyTodayCard } from '@/components/journey-today-card';
import { JourneyTimelineVirtualized } from '@/components/journey-timeline-virtualized';
import { DailyIntentionCard } from '@/components/daily-intention-card';
import { DAY_IDENTITY_30, WEEKLY_EMOTIONAL_ARCS, getWeekForDay } from '@/lib/journey-emotional-arc';
import { getServerDictionary } from '@/lib/i18n/server';

interface Lesson {
  id: string;
  day_number: number;
  title: string;
  subtitle: string | null;
  topic: string;
  estimated_minutes: number;
}

interface JourneyPageProps {
  searchParams: Promise<{ notice?: string }>;
}

function getProgressForLesson(progress: UserProgress[], lessonId: string): UserProgress | undefined {
  return progress.find(p => p.lesson_id === lessonId);
}

function getCurrentLesson(lessons: Lesson[], progress: UserProgress[]): Lesson | null {
  for (const lesson of lessons) {
    const lessonProgress = getProgressForLesson(progress, lesson.id);
    if (lessonProgress?.status !== 'completed') {
      return lesson;
    }
  }

  return lessons[lessons.length - 1] || null;
}

export const revalidate = 60;

export default async function JourneyPage({ searchParams }: JourneyPageProps) {
  const { notice } = await searchParams;
  const { dictionary: copy } = await getServerDictionary();
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const lessons = await getPublishedLessons();
  const progress = await getUserProgress(user.id);

  const currentLesson = getCurrentLesson(lessons, progress);
  const currentDay = currentLesson?.day_number || 1;
  const currentWeek = getWeekForDay(currentDay);
  const currentArc = WEEKLY_EMOTIONAL_ARCS.find((arc) => arc.week === currentWeek);
  const dayIdentity = DAY_IDENTITY_30.find((item) => item.day === currentDay);

  return (
    <div className="px-4 md:px-8 lg:px-16 pt-8 md:pt-12 pb-16 max-w-[960px] mx-auto">
      {notice === 'return-tomorrow' && (
        <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          {copy.journey.page.returnTomorrowNotice}
        </div>
      )}
      {notice === 'welcome-back' && (
        <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          {copy.journey.page.welcomeBackNotice}
        </div>
      )}

      <JourneyTodayCard
        currentDay={currentDay}
        currentLesson={currentLesson || undefined}
        nextLessonHref={currentLesson ? `/journey/${currentLesson.day_number}` : undefined}
        weekChapter={currentArc?.chapterTitle}
        emotionalNote={dayIdentity?.primaryEmotionalNote}
      />

      <DailyIntentionCard nextLessonDay={currentLesson?.day_number} />

      {lessons.length > 0 && (
        <details className="group rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]/85 p-5 md:p-6">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-medium text-[var(--color-text)]">{copy.journey.page.revisitHeading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {copy.journey.page.revisitDescription}
              </p>
            </div>
            <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-transform group-open:rotate-180">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </summary>

          <div className="mt-6 max-h-[560px] overflow-auto pr-1">
            <JourneyTimelineVirtualized 
              lessons={lessons} 
              progress={progress} 
              currentDay={currentDay}
            />
          </div>
        </details>
      )}
    </div>
  );
}
