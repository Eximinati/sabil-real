import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { getPublishedLessons, getUserProgress, UserProgress } from '@/lib/journey';
import { JourneyTodayCard } from '@/components/journey-today-card';
import { JourneyTimelineVirtualized } from '@/components/journey-timeline-virtualized';
import { DailyIntentionCard } from '@/components/daily-intention-card';

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

      <DailyIntentionCard nextLessonDay={currentLesson?.day_number} />

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Your Path</h2>
        {completedCount === 0 && (
          <p className="text-[var(--color-text-muted)] text-sm mt-1">You are at the beginning of your transformation journey.</p>
        )}
      </div>
      <JourneyTimelineVirtualized 
        lessons={lessons} 
        progress={progress} 
        currentDay={currentDay}
        itemsPerPage={10}
      />
    </div>
  );
}