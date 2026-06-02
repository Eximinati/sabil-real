import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase-server';
import { getLessonByDay, getLessonByDayWithBlocks, getUserProgress, getUserReflection, getUserPreferences } from '@/lib/journey';
import { StreamingLessonShell } from '@/components/journey-lesson-streaming';
import { EmptyState } from '@/components/ui/empty-state';
import { getServerDictionary } from '@/lib/i18n/server';
import { buildCanonicalJourneyPlan } from '@/lib/journey-canonical';
import { resolveLanguagePreference, type PreferenceLanguage } from '@/lib/user-preferences';
import { JOURNEY_LANGUAGE_COOKIE_NAME } from '@/lib/i18n/config';
import { fetchVersesForBlocks } from '@/lib/fetch-verses-server';

interface PageProps {
  params: Promise<{ day: string }>;
  searchParams: Promise<{ translation?: string }>;
}


function parsePositiveInt(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export default async function LessonPage({ params, searchParams }: PageProps) {
  const { day } = await params;
  const { translation: urlTranslation } = await searchParams;
  const dayNumber = parseInt(day, 10);
  const { dictionary: copy, language } = await getServerDictionary();

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const preferences = await getUserPreferences(user.id);
  const cookieStore = await cookies();
  const cookieJourneyLanguage = cookieStore.get(JOURNEY_LANGUAGE_COOKIE_NAME)?.value as PreferenceLanguage | undefined;
  const effectiveJourneyPreference = cookieJourneyLanguage || preferences.journey_language;
  const journeyLanguage = resolveLanguagePreference(effectiveJourneyPreference, language);
  const lessonWithBlocks = await getLessonByDayWithBlocks(dayNumber, journeyLanguage);

  if (!lessonWithBlocks) {
    return (
      <div className="px-6 pt-12 pb-12 max-w-[740px] mx-auto">
        <EmptyState
          icon="journey"
          title={copy.common.emptyState.lessonNotAvailable}
          description={copy.common.emptyState.lessonNotAvailableDescription}
          actionLabel={copy.common.emptyState.backToJourney}
          actionHref="/journey"
        />
      </div>
    );
  }

  const [progress, reflectionData] = await Promise.all([
    getUserProgress(user.id),
    getUserReflection(user.id, lessonWithBlocks.id)
  ]);

  const lessonProgress = progress.find(p => p.lesson_id === lessonWithBlocks.id);
  const progressStatus = lessonProgress?.status || 'not_started';
  const isCompleted = progressStatus === 'completed';
  const translationId = parsePositiveInt(urlTranslation) || preferences.translation_id;
  const tafsirId = preferences.tafsir_id;
  const hadithLanguage = preferences.hadith_language;
  const canonicalPlan = buildCanonicalJourneyPlan(lessonWithBlocks, {
    language: journeyLanguage,
    preferences,
  });
  const nextLesson = await getLessonByDay(dayNumber + 1, journeyLanguage);

  const blockVerseKeys = (lessonWithBlocks.blocks || [])
    .filter((b) => b.block_type === 'verse')
    .map((b) => b.content.verse_key as string)
    .filter(Boolean);
  const initialVerseData = blockVerseKeys.length > 0
    ? await fetchVersesForBlocks(blockVerseKeys, translationId)
    : {};

  const hasReflectionSection = !!(
    lessonWithBlocks.reflection_prompt ||
    lessonWithBlocks.blocks?.some(b => b.block_type === 'reflection') ||
    canonicalPlan?.sections?.some(s => s.id === 'reflection-prompt')
  );

  return (
    <StreamingLessonShell
      lesson={lessonWithBlocks}
      blocks={lessonWithBlocks.blocks}
      canonicalPlan={canonicalPlan}
      initialReflection={reflectionData.text || ''}
      initialReflectionUpdatedAt={reflectionData.updatedAt}
      isCompleted={isCompleted}
      translationId={translationId}
      tafsirId={tafsirId}
      hadithLanguage={hadithLanguage}
      journeyLanguage={preferences.journey_language}
      urlTranslation={urlTranslation}
      hasNextDay={!!nextLesson}
      initialVerseData={initialVerseData}
      progressStatus={progressStatus}
      hasReflectionSection={hasReflectionSection}
    />
  );
}
