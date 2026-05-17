import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { getPublishedLessons, getUserProgress, UserProgress } from '@/lib/journey';

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

export const dynamic = 'force-dynamic';

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

  return (
    <div className="px-16 pt-12 pb-12">
      <div className="text-center mb-10">
        <h1 className="font-arabic text-[36px] text-[#B7922A]" dir="rtl">رحلتي</h1>
        <p className="text-[#6B7280] text-sm mt-2">My Journey</p>
        <p className="text-[#6B7280] text-sm mt-1 max-w-lg mx-auto">
          Your guided path to understanding Islam, one day at a time.
        </p>
      </div>

      <div className="max-w-[400px] mx-auto mb-12">
        <p className="text-center text-[#6B7280] text-sm mb-2">
          Day {completedCount + 1} of {totalLessons}
        </p>
        <div className="h-2 bg-[#E8E0D5] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2D6A4F] rounded-full transition-all duration-300"
            style={{ width: `${totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0}%` }}
          />
        </div>
        <p className="text-center text-[#6B7280] text-sm mt-2">{completedCount} days completed</p>
      </div>

      <div className="max-w-[680px] mx-auto space-y-4">
        {lessons.map((lesson) => {
          const lessonProgress = getProgressForLesson(progress, lesson.id);
          const status = lessonProgress?.status || 'not_started';
          const unlocked = isLessonUnlocked(lesson, progress, lessons);

          return (
            <div
              key={lesson.id}
              className={`bg-white border rounded-xl p-5 ${!unlocked ? 'opacity-60 cursor-not-allowed' : 'hover:border-[#2D6A4F] transition-colors'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium ${
                    status === 'completed' 
                      ? 'bg-[#2D6A4F] text-white' 
                      : status === 'in_progress'
                        ? 'bg-[#B7922A] text-white'
                        : unlocked
                          ? 'bg-[#B7922A] text-white'
                          : 'bg-[#E8E0D5] text-[#6B7280]'
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
                    <h3 className={`font-medium ${status === 'completed' ? 'text-[#6B7280]' : 'text-[#1A1A1A]'}`}>
                      {lesson.title}
                    </h3>
                    {lesson.subtitle && (
                      <p className="text-sm text-[#6B7280]">{lesson.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {unlocked ? (
                    <>
                      <span className="text-xs text-[#6B7280]">~{lesson.estimated_minutes} min</span>
                      {status === 'completed' ? (
                        <span className="text-sm text-[#2D6A4F]">Review</span>
                      ) : status === 'in_progress' ? (
                        <a
                          href={`/journey/${lesson.day_number}`}
                          className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Continue →
                        </a>
                      ) : (
                        <a
                          href={`/journey/${lesson.day_number}`}
                          className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Begin →
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-[#6B7280]">~{lesson.estimated_minutes} min</span>
                      <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </>
                  )}
                </div>
              </div>

              {unlocked && (
                <div className="mt-3">
                  <span className="inline-block px-2 py-1 bg-[#F0F9F4] text-[#2D6A4F] rounded text-xs">
                    {lesson.topic}
                  </span>
                  {status === 'in_progress' && (
                    <span className="ml-2 px-2 py-1 bg-[#B7922A] text-white rounded text-xs">
                      In Progress
                    </span>
                  )}
                  {status === 'completed' && (
                    <span className="ml-2 px-2 py-1 bg-[#2D6A4F] text-white rounded text-xs">
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