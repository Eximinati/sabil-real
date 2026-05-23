import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { getLessonByDayWithBlocks, getUserProgress, getUserReflection, getUserPreferences } from '@/lib/journey';
import { StreamingLessonShell } from '@/components/journey-lesson-streaming';
import { EmptyState } from '@/components/ui/empty-state';

interface PageProps {
  params: Promise<{ day: string }>;
  searchParams: Promise<{ translation?: string }>;
}

export const revalidate = 60;

export default async function LessonPage({ params, searchParams }: PageProps) {
  const { day } = await params;
  const { translation: urlTranslation } = await searchParams;
  const dayNumber = parseInt(day, 10);

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const lessonWithBlocks = await getLessonByDayWithBlocks(dayNumber);
  
  if (!lessonWithBlocks) {
    return (
      <div className="px-6 pt-12 pb-12 max-w-[740px] mx-auto">
        <EmptyState
          icon="journey"
          title="Lesson not available"
          description="This lesson may have been removed or the link is incorrect."
          actionLabel="Back to Journey"
          actionHref="/journey"
        />
      </div>
    );
  }

  const [progress, preferences, initialReflection] = await Promise.all([
    getUserProgress(user.id),
    getUserPreferences(user.id),
    getUserReflection(user.id, lessonWithBlocks.id)
  ]);

  const lessonProgress = progress.find(p => p.lesson_id === lessonWithBlocks.id);
  const status = lessonProgress?.status || 'not_started';
  const isCompleted = status === 'completed';
  const translationId = urlTranslation ? parseInt(urlTranslation, 10) : preferences.translation_id;
  const tafsirId = preferences.tafsir_id;

  return (
    <StreamingLessonShell
      lesson={lessonWithBlocks}
      blocks={lessonWithBlocks.blocks}
      initialReflection={initialReflection || ''}
      isCompleted={isCompleted}
      translationId={translationId}
      tafsirId={tafsirId}
      urlTranslation={urlTranslation}
    />
  );
}
