import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { getPublishedLessons, getUserProgress, UserProgress } from '@/lib/journey';
import { JourneyTodayCard } from '@/components/journey-today-card';
import { JourneyTimeline } from '@/components/journey-timeline';

interface Lesson {
  id: string;
  day_number: number;
  title: string;
  subtitle: string | null;
  topic: string;
  estimated_minutes: number;
}

function getProgressForLesson(progress: UserProgress[], lessonId: string): UserProgress | undefined {
  return progress.find(p => p.lesson_id === lessonId);
}

function isLessonUnlocked(lesson: Lesson, progress: UserProgress[], lessons: Lesson[]): boolean {
  if (lesson.day_number === 1) return true;
  
  const prevLesson = lessons.find(l => l.day_number === lesson.day_number - 1);
  if (!prevLesson) return true;
  
  const prevProgress = getProgressForLesson(progress, prevLesson.id);
  return prevProgress?.status === 'completed';
}

function calculateStreak(progress: UserProgress[], lessons: Lesson[]): number {
  const completedDays = progress
    .filter(p => p.status === 'completed')
    .map(p => p.day_number)
    .sort((a, b) => b - a);
  
  if (completedDays.length === 0) return 0;
  
  let streak = 0;
  let expectedDay = completedDays[0];
  
  for (const day of completedDays) {
    if (day === expectedDay) {
      streak++;
      expectedDay--;
    } else if (day < expectedDay) {
      break;
    }
  }
  
  return streak;
}

function getCurrentLesson(currentDay: number, lessons: Lesson[], progress: UserProgress[]): Lesson | null {
  const lesson = lessons.find(l => l.day_number === currentDay);
  if (!lesson) return lessons[0] || null;
  
  const lessonProgress = getProgressForLesson(progress, lesson.id);
  if (lessonProgress?.status === 'completed') {
    return getCurrentLesson(currentDay + 1, lessons, progress);
  }
  
  return lesson;
}

export const revalidate = 60;

export default async function JourneyPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const lessons = await getPublishedLessons();
  const progress = await getUserProgress(user.id);

  const completedCount = progress.filter(p => p.status === 'completed').length;
  const totalLessons = lessons.length;
  const currentDay = completedCount + 1;
  const streak = calculateStreak(progress, lessons);
const avgMinutes = totalLessons > 0 
    ? Math.round(lessons.reduce((sum, l) => sum + l.estimated_minutes, 0) / totalLessons)
    : 15;
  const currentLesson = getCurrentLesson(currentDay, lessons, progress);
  const currentLessonProgress = currentLesson ? getProgressForLesson(progress, currentLesson.id) : null;
  const isCompletedToday = currentLessonProgress?.status === 'completed';

  return (
    <div className="px-4 md:px-16 pt-8 md:pt-12 pb-12">
      <JourneyTodayCard
        currentDay={currentDay}
        totalDays={totalLessons}
        completedDays={completedCount}
        streak={streak}
        currentLesson={currentLesson || undefined}
        nextLessonHref={currentLesson ? `/journey/${currentLesson.day_number}` : undefined}
        isCompletedToday={isCompletedToday}
      />

      <JourneyTimeline 
        lessons={lessons} 
        progress={progress} 
        currentDay={currentDay} 
      />

      <div className="max-w-[680px] mx-auto space-y-4">
        {lessons.map((lesson) => {
          const lessonProgress = getProgressForLesson(progress, lesson.id);
          const status = lessonProgress?.status || 'not_started';
          const unlocked = isLessonUnlocked(lesson, progress, lessons);

          return (
            <div
              key={lesson.id}
              className={`bg-[var(--color-surface)] border rounded-xl p-4 md:p-5 card-hover ${!unlocked ? 'opacity-60 cursor-not-allowed' : 'hover:border-[var(--color-primary)] border-[var(--color-border)]'}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                <div className="mt-3 flex flex-wrap gap-2">
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
  );
}