import { supabaseServer } from './supabase-server';
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/lib/i18n/config';
import {
  localizeBlockContent,
  localizeLesson,
  resolveLessonLanguageContext,
} from './journey-localization';
import type {
  JourneyLanguageContext,
  JourneyLocalizedContentMap,
  JourneySharedMetadata,
  JourneyTranslationStatusMap,
} from '@/types/journey-localization';

export interface JourneyLesson {
  id: string;
  day_number: number;
  title: string;
  subtitle: string | null;
  topic: string;
  description: string | null;
  verse_keys: string[];
  lesson_text: string | null;
  hadith_text: string | null;
  hadith_source: string | null;
  hadith_collection: string | null;
  hadith_number: number | null;
  reflection_prompt: string | null;
  estimated_minutes: number;
  is_published: boolean;
  localized_content?: JourneyLocalizedContentMap | null;
  translation_status?: JourneyTranslationStatusMap | null;
  shared_metadata?: JourneySharedMetadata | null;
  language_context?: JourneyLanguageContext;
}

export interface LessonBlock {
  id: string;
  lesson_id: string;
  order_index: number;
  block_type: string;
  content: Record<string, unknown>;
}

export interface JourneyLessonWithBlocks extends JourneyLesson {
  blocks: LessonBlock[];
}

export interface UserProgress {
  lesson_id: string;
  day_number: number;
  status: 'not_started' | 'in_progress' | 'completed';
  completed_at: string | null;
}

export interface UserPreferences {
  translation_id: number;
  tafsir_id: number;
  reminders_enabled: boolean;
  reminder_time: string | null;
  reminder_language: 'auto' | 'en' | 'ur';
  last_active_at: string | null;
}

function localizeJourneyLesson(lesson: JourneyLesson, language: LanguageCode): JourneyLesson {
  const languageContext = resolveLessonLanguageContext(lesson, language);
  const localizedLesson = localizeLesson(lesson, languageContext.resolved);

  return {
    ...localizedLesson,
    language_context: languageContext,
  };
}

export async function getPublishedLessons(
  language: LanguageCode = DEFAULT_LANGUAGE
): Promise<JourneyLesson[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('journey_lessons')
    .select('*')
    .eq('is_published', true)
    .order('day_number', { ascending: true });
  if (error) throw error;

  const lessons = (data ?? []) as JourneyLesson[];
  return lessons.map((lesson) => localizeJourneyLesson(lesson, language));
}

export async function getLessonByDay(
  dayNumber: number,
  language: LanguageCode = DEFAULT_LANGUAGE
): Promise<JourneyLesson | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('journey_lessons')
    .select('*')
    .eq('day_number', dayNumber)
    .eq('is_published', true)
    .single();
  if (error) return null;
  return localizeJourneyLesson(data as JourneyLesson, language);
}

export async function getLessonByDayWithBlocks(
  dayNumber: number,
  language: LanguageCode = DEFAULT_LANGUAGE
): Promise<JourneyLessonWithBlocks | null> {
  const supabase = await supabaseServer();
  
  const { data: lesson, error } = await supabase
    .from('journey_lessons')
    .select('*')
    .eq('day_number', dayNumber)
    .eq('is_published', true)
    .single();
  
  if (error || !lesson) return null;

  const localizedLesson = localizeJourneyLesson(lesson as JourneyLesson, language);
  const resolvedLanguage = localizedLesson.language_context?.resolved ?? DEFAULT_LANGUAGE;

  const { data: blocks, error: blocksError } = await supabase
    .from('journey_lesson_blocks')
    .select('id, lesson_id, order_index, block_type, content')
    .eq('lesson_id', lesson.id)
    .order('order_index', { ascending: true });

  return {
    ...localizedLesson,
    blocks: (blocks || []).map((block) => ({
      ...block,
      content: localizeBlockContent(
        block.content as Record<string, unknown>,
        resolvedLanguage
      ),
    })),
  };
}

export async function getUserProgress(
  userId: string
): Promise<UserProgress[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('user_journey_progress')
    .select('lesson_id, day_number, status, completed_at')
    .eq('user_id', userId);
  if (error) return [];
  return data ?? [];
}

export async function getUserPreferences(
  userId: string
): Promise<UserPreferences> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from('user_preferences')
    .select('translation_id, tafsir_id, reminders_enabled, reminder_time, reminder_language, last_active_at')
    .eq('user_id', userId)
    .single();

  return data ?? {
    translation_id: 203,
    tafsir_id: 169,
    reminders_enabled: false,
    reminder_time: '20:30:00',
    reminder_language: 'auto',
    last_active_at: null,
  };
}

export async function touchUserLastActive(userId: string): Promise<void> {
  const supabase = await supabaseServer();
  const timestamp = new Date().toISOString();

  await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        last_active_at: timestamp,
        updated_at: timestamp,
      },
      { onConflict: 'user_id' }
    );
}

export async function startLesson(
  userId: string,
  lessonId: string,
  dayNumber: number
): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from('user_journey_progress').upsert({
    user_id: userId,
    lesson_id: lessonId,
    day_number: dayNumber,
    status: 'in_progress',
    started_at: new Date().toISOString(),
  }, { onConflict: 'user_id,lesson_id' });
}

export async function completeLesson(
  userId: string,
  lessonId: string,
  dayNumber: number
): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from('user_journey_progress').upsert({
    user_id: userId,
    lesson_id: lessonId,
    day_number: dayNumber,
    status: 'completed',
    completed_at: new Date().toISOString(),
  }, { onConflict: 'user_id,lesson_id' });
}

export async function saveReflection(
  userId: string,
  lessonId: string,
  dayNumber: number,
  reflectionText: string
): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from('user_reflections').upsert({
    user_id: userId,
    lesson_id: lessonId,
    day_number: dayNumber,
    reflection_text: reflectionText,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,lesson_id' });
}

export async function getUserReflection(
  userId: string,
  lessonId: string
): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from('user_reflections')
    .select('reflection_text')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single();
  return data?.reflection_text ?? null;
}
