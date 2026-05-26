import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { getLessonByDay, getLessonByDayWithBlocks, getUserProgress, getUserReflection, getUserPreferences } from '@/lib/journey';
import { StreamingLessonShell } from '@/components/journey-lesson-streaming';
import { EmptyState } from '@/components/ui/empty-state';
import { getServerDictionary } from '@/lib/i18n/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildCanonicalJourneyPlan } from '@/lib/journey-canonical';
import type { LanguageCode } from '@/lib/i18n/config';

interface PageProps {
  params: Promise<{ day: string }>;
  searchParams: Promise<{ translation?: string }>;
}

export const revalidate = 60;

async function readDayMarkdown(dayNumber: number): Promise<Partial<Record<LanguageCode, string>>> {
  const dayFolder = `day-${String(dayNumber).padStart(2, '0')}`;
  const structuredBasePath = path.join(process.cwd(), 'content', 'journey', 'days', dayFolder);
  const legacyPath = path.join(process.cwd(), 'content', 'journey', `day${dayNumber}.md`);

  async function readIfExists(filePath: string): Promise<string | null> {
    try {
      return await readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  const [enStructured, ur, enLegacy] = await Promise.all([
    readIfExists(path.join(structuredBasePath, 'en.md')),
    readIfExists(path.join(structuredBasePath, 'ur.md')),
    readIfExists(legacyPath),
  ]);

  const en = enStructured || enLegacy;

  return {
    ...(en ? { en } : {}),
    ...(ur ? { ur } : {}),
  };
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

  const lessonWithBlocks = await getLessonByDayWithBlocks(dayNumber, language);
  
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

  const [progress, preferences, initialReflection] = await Promise.all([
    getUserProgress(user.id),
    getUserPreferences(user.id),
    getUserReflection(user.id, lessonWithBlocks.id)
  ]);

  const lessonProgress = progress.find(p => p.lesson_id === lessonWithBlocks.id);
  const status = lessonProgress?.status || 'not_started';
  const isCompleted = status === 'completed';
  const translationId = parsePositiveInt(urlTranslation) || preferences.translation_id;
  const tafsirId = preferences.tafsir_id;
  const hadithLanguage = preferences.hadith_language;
  const markdownByLanguage = await readDayMarkdown(dayNumber);
  const canonicalPlan = buildCanonicalJourneyPlan(lessonWithBlocks, {
    language,
    markdownByLanguage,
    preferences,
  });
  const nextLesson = await getLessonByDay(dayNumber + 1, language);

  return (
    <StreamingLessonShell
      lesson={lessonWithBlocks}
      blocks={lessonWithBlocks.blocks}
      canonicalPlan={canonicalPlan}
      initialReflection={initialReflection || ''}
      isCompleted={isCompleted}
      translationId={translationId}
      tafsirId={tafsirId}
      hadithLanguage={hadithLanguage}
      urlTranslation={urlTranslation}
      hasNextDay={!!nextLesson}
    />
  );
}
