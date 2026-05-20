import { supabaseServer } from './supabase-server';

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
}

export async function getPublishedLessons(): Promise<JourneyLesson[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('journey_lessons')
    .select('*')
    .eq('is_published', true)
    .order('day_number', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getLessonByDay(
  dayNumber: number
): Promise<JourneyLesson | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('journey_lessons')
    .select('*')
    .eq('day_number', dayNumber)
    .eq('is_published', true)
    .single();
  if (error) return null;
  return data;
}

export async function getLessonByDayWithBlocks(
  dayNumber: number
): Promise<JourneyLessonWithBlocks | null> {
  const supabase = await supabaseServer();
  
  const { data: lesson, error } = await supabase
    .from('journey_lessons')
    .select('*')
    .eq('day_number', dayNumber)
    .eq('is_published', true)
    .single();
  
  if (error || !lesson) return null;

  const { data: blocks, error: blocksError } = await supabase
    .from('journey_lesson_blocks')
    .select('id, lesson_id, order_index, block_type, content')
    .eq('lesson_id', lesson.id)
    .order('order_index', { ascending: true });

  return {
    ...lesson,
    blocks: blocks || [],
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
    .select('translation_id, tafsir_id')
    .eq('user_id', userId)
    .single();
  return data ?? { translation_id: 203, tafsir_id: 169 };
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