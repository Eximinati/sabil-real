import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { getLessonByDay, getUserProgress, getUserReflection, getUserPreferences } from '@/lib/journey';
import { JourneyLessonClient } from '@/components/journey-lesson-client';
import { getApiUrl } from '@/lib/api-url';
import { EmptyState } from '@/components/ui/empty-state';

interface PageProps {
  params: Promise<{ day: string }>;
  searchParams: Promise<{ translation?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function LessonPage({ params, searchParams }: PageProps) {
  const { day } = await params;
  const { translation: urlTranslation } = await searchParams;
  const dayNumber = parseInt(day, 10);

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const lesson = await getLessonByDay(dayNumber);
  if (!lesson) {
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

  const progress = await getUserProgress(user.id);
  const lessonProgress = progress.find(p => p.lesson_id === lesson.id);
  const status = lessonProgress?.status || 'not_started';
  const isCompleted = status === 'completed';

  const preferences = await getUserPreferences(user.id);
  const translationId = urlTranslation ? parseInt(urlTranslation, 10) : preferences.translation_id;
  const initialReflection = await getUserReflection(user.id, lesson.id);

  let chapters: any[] = [];
  try {
    const chaptersRes = await fetch(getApiUrl('/chapters'), { cache: 'no-store' });
    const chaptersData = await chaptersRes.json();
    chapters = Array.isArray(chaptersData) ? chaptersData : [];
  } catch (e) {
    chapters = [];
  }

  const verses: Array<{ verse: any | null; chapterName: string; verseKey: string; audioUrl?: string }> = [];
  
  const chapterIds = [...new Set(lesson.verse_keys.map(vk => vk.split(':')[0]))];
  const audioFilesMap: Record<string, Array<{ verse_key: string; url: string }>> = {};
  
  for (const chapterId of chapterIds) {
    try {
      const audioRes = await fetch(getApiUrl(`/audio/5/${chapterId}`), { cache: 'no-store' });
      const audioData = await audioRes.json();
      if (audioData.audio_files) {
        audioFilesMap[chapterId] = audioData.audio_files;
      }
    } catch (e) {
      audioFilesMap[chapterId] = [];
    }
  }
  
  for (const verseKey of lesson.verse_keys) {
    const [chapterId, verseNum] = verseKey.split(':');
    try {
      const verseRes = await fetch(
        getApiUrl(`/verses/by_key/${verseKey}?translation=${translationId}`),
        { cache: 'no-store' }
      );
      const verseData = await verseRes.json();
      const chapter = chapters.find(c => c.id === parseInt(chapterId));
      
      const audioFile = audioFilesMap[chapterId]?.find((af: any) => af.verse_key === verseKey);
      const audioUrl = audioFile?.url;
      
      verses.push({ 
        verse: verseData?.verse || null, 
        chapterName: chapter?.name_simple || `Chapter ${chapterId}`,
        verseKey: verseKey,
        audioUrl: audioUrl
      });
    } catch (e) {
      verses.push({ verse: null, chapterName: `Chapter ${chapterId}`, verseKey: verseKey });
    }
  }

  let hadith: any = null;
  if (lesson.hadith_collection && lesson.hadith_number) {
    try {
      const hadithRes = await fetch(
        getApiUrl(`/hadith/${lesson.hadith_collection}/${lesson.hadith_number}`)
      );
      const hadithData = await hadithRes.json();
      hadith = hadithData?.hadith || null;
    } catch (e) {
      hadith = null;
    }
  }

  return (
    <JourneyLessonClient
      lesson={lesson}
      verses={verses}
      hadith={hadith}
      initialReflection={initialReflection || ''}
      isCompleted={isCompleted}
      status={status}
      translationId={translationId}
    />
  );
}