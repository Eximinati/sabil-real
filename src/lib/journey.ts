import { cache } from 'react';
import { supabaseServer } from './supabase-server';
import { journeyCache } from './journey-server-cache';
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
import {
  DEFAULT_REMINDER_TIME,
  DEFAULT_TAFSIR_ID,
  DEFAULT_TRANSLATION_ID,
  parseHadithLanguagePreference,
  parsePreferenceLanguage,
  type HadithLanguagePreference,
  type PreferenceLanguage,
} from './user-preferences';

const LOG_PREFIX = '[JourneyDB]';
const IS_DEBUG = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_JOURNEY_DEBUG === '1';
const log = IS_DEBUG
  ? (msg: string, ...args: unknown[]) => console.log(`${LOG_PREFIX} ${msg}`, ...args)
  : () => {};

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
  hadith_language: HadithLanguagePreference;
  ui_language: PreferenceLanguage;
  journey_language: PreferenceLanguage;
  reminders_enabled: boolean;
  reminder_time: string | null;
  reminder_language: PreferenceLanguage;
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

async function _getPublishedLessons(
  language: LanguageCode = DEFAULT_LANGUAGE
): Promise<JourneyLesson[]> {
  const key = `journey:lessons:${language}`;

  const cached = journeyCache.get<JourneyLesson[]>(key);
  if (cached) return cached;

  const pending = journeyCache.getPending<JourneyLesson[]>(key);
  if (pending) return pending;

  const start = Date.now();
  log(`getPublishedLessons ENTER lang=${language}`);

  const promise = (async () => {
    const supabase = await supabaseServer();
    const { data, error } = await supabase
      .from('journey_lessons')
      .select('id, day_number, title, subtitle, topic, description, verse_keys, lesson_text, hadith_text, hadith_source, hadith_collection, hadith_number, reflection_prompt, estimated_minutes, is_published, localized_content, translation_status, shared_metadata')
      .eq('is_published', true)
      .order('day_number', { ascending: true });
    if (error) throw error;

    const lessons = (data ?? []) as JourneyLesson[];
    const result = lessons.map((lesson) => localizeJourneyLesson(lesson, language));

    const duration = Date.now() - start;
    log(`getPublishedLessons EXIT count=${result.length} lang=${language} duration=${duration}ms`);

    return result;
  })();

  journeyCache.setPending(key, promise);

  try {
    const result = await promise;
    journeyCache.set(key, result);
    return result;
  } catch (error) {
    log(`getPublishedLessons ERROR lang=${language}:`, error);
    throw error;
  } finally {
    journeyCache.deletePending(key);
  }
}

export const getPublishedLessons = cache(_getPublishedLessons);

async function _getLessonByDay(
  dayNumber: number,
  language: LanguageCode = DEFAULT_LANGUAGE
): Promise<JourneyLesson | null> {
  const key = `journey:lesson:${dayNumber}:${language}:meta`;

  const cached = journeyCache.get<JourneyLesson | null>(key);
  if (cached !== null) return cached;

  const pending = journeyCache.getPending<JourneyLesson | null>(key);
  if (pending !== undefined) return pending;

  const start = Date.now();
  log(`getLessonByDay ENTER day=${dayNumber} lang=${language}`);

  const promise = (async () => {
    const supabase = await supabaseServer();
    const { data, error } = await supabase
      .from('journey_lessons')
      .select('id, day_number, title, subtitle, topic, description, verse_keys, lesson_text, hadith_text, hadith_source, hadith_collection, hadith_number, reflection_prompt, estimated_minutes, is_published, localized_content, translation_status, shared_metadata')
      .eq('day_number', dayNumber)
      .eq('is_published', true)
      .single();
    if (error) {
      const duration = Date.now() - start;
      log(`getLessonByDay EXIT day=${dayNumber} lang=${language} found=false duration=${duration}ms`);
      return null;
    }

    const result = localizeJourneyLesson(data as JourneyLesson, language);
    const duration = Date.now() - start;
    log(`getLessonByDay EXIT day=${dayNumber} lang=${language} found=true duration=${duration}ms`);

    return result;
  })();

  journeyCache.setPending(key, promise);

  try {
    const result = await promise;
    if (result !== null) {
      journeyCache.set(key, result);
    }
    return result;
  } catch (error) {
    log(`getLessonByDay ERROR day=${dayNumber} lang=${language}:`, error);
    throw error;
  } finally {
    journeyCache.deletePending(key);
  }
}

export const getLessonByDay = cache(_getLessonByDay);

async function _getLessonByDayWithBlocks(
  dayNumber: number,
  language: LanguageCode = DEFAULT_LANGUAGE
): Promise<JourneyLessonWithBlocks | null> {
  const key = `journey:lesson:${dayNumber}:${language}`;

  const cached = journeyCache.get<JourneyLessonWithBlocks | null>(key);
  if (cached !== null) return cached;

  const pending = journeyCache.getPending<JourneyLessonWithBlocks | null>(key);
  if (pending !== undefined) return pending;

  const start = Date.now();
  log(`getLessonByDayWithBlocks ENTER day=${dayNumber} lang=${language}`);

  const promise = (async () => {
    const supabase = await supabaseServer();
    
    const { data: lesson, error } = await supabase
      .from('journey_lessons')
      .select('id, day_number, title, subtitle, topic, description, verse_keys, lesson_text, hadith_text, hadith_source, hadith_collection, hadith_number, reflection_prompt, estimated_minutes, is_published, localized_content, translation_status, shared_metadata')
      .eq('day_number', dayNumber)
      .eq('is_published', true)
      .single();
    
    if (error || !lesson) {
      const duration = Date.now() - start;
      log(`getLessonByDayWithBlocks EXIT day=${dayNumber} lang=${language} found=false duration=${duration}ms`);
      return null;
    }

    const localizedLesson = localizeJourneyLesson(lesson as JourneyLesson, language);
    const resolvedLanguage = localizedLesson.language_context?.resolved ?? DEFAULT_LANGUAGE;

    const { data: blocks, error: blocksError } = await supabase
      .from('journey_lesson_blocks')
      .select('id, lesson_id, order_index, block_type, content')
      .eq('lesson_id', lesson.id)
      .order('order_index', { ascending: true });

    const result = {
      ...localizedLesson,
      blocks: (blocks || []).map((block) => ({
        ...block,
        content: localizeBlockContent(
          block.content as Record<string, unknown>,
          resolvedLanguage
        ),
      })),
    };

    const duration = Date.now() - start;
    log(`getLessonByDayWithBlocks EXIT day=${dayNumber} lang=${language} blocks=${result.blocks.length} duration=${duration}ms`);

    return result;
  })();

  journeyCache.setPending(key, promise);

  try {
    const result = await promise;
    if (result !== null) {
      journeyCache.set(key, result);
    }
    return result;
  } catch (error) {
    log(`getLessonByDayWithBlocks ERROR day=${dayNumber} lang=${language}:`, error);
    throw error;
  } finally {
    journeyCache.deletePending(key);
  }
}

export const getLessonByDayWithBlocks = cache(_getLessonByDayWithBlocks);

export const getUserProgress = cache(async (userId: string): Promise<UserProgress[]> => {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('user_journey_progress')
    .select('lesson_id, day_number, status, completed_at')
    .eq('user_id', userId);
  if (error) return [];
  return data ?? [];
});

export const getUserPreferences = cache(async (userId: string): Promise<UserPreferences> => {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from('user_preferences')
    .select('translation_id, tafsir_id, hadith_language, ui_language, journey_language, reminders_enabled, reminder_time, reminder_language, last_active_at')
    .eq('user_id', userId)
    .single();

  const defaults: UserPreferences = {
    translation_id: DEFAULT_TRANSLATION_ID,
    tafsir_id: DEFAULT_TAFSIR_ID,
    hadith_language: 'auto',
    ui_language: 'auto',
    journey_language: 'auto',
    reminders_enabled: false,
    reminder_time: DEFAULT_REMINDER_TIME,
    reminder_language: 'auto',
    last_active_at: null,
  };

  if (!data) {
    return defaults;
  }

  const merged = {
    ...defaults,
    ...data,
  };

  return {
    ...merged,
    reminder_time: merged.reminder_time ?? DEFAULT_REMINDER_TIME,
    hadith_language: parseHadithLanguagePreference(merged.hadith_language),
    ui_language: parsePreferenceLanguage(merged.ui_language),
    journey_language: parsePreferenceLanguage(merged.journey_language),
    reminder_language: parsePreferenceLanguage(merged.reminder_language),
  };
});

const touchCooldowns = new Map<string, number>();
const TOUCH_COOLDOWN_MS = 5 * 60 * 1000;

export async function touchUserLastActive(userId: string): Promise<void> {
  const now = Date.now();
  const last = touchCooldowns.get(userId);
  if (last && now - last < TOUCH_COOLDOWN_MS) {
    return;
  }
  touchCooldowns.set(userId, now);

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
  const { error } = await supabase.from('user_journey_progress').upsert({
    user_id: userId,
    lesson_id: lessonId,
    day_number: dayNumber,
    status: 'in_progress',
    started_at: new Date().toISOString(),
  }, { onConflict: 'user_id,lesson_id' });

  if (error) {
    console.error('startLesson error:', error);
    throw new Error(`Failed to start lesson: ${error.message}`);
  }
}

export async function completeLesson(
  userId: string,
  lessonId: string,
  dayNumber: number
): Promise<void> {
  const supabase = await supabaseServer();
  const { error } = await supabase.from('user_journey_progress').upsert({
    user_id: userId,
    lesson_id: lessonId,
    day_number: dayNumber,
    status: 'completed',
    completed_at: new Date().toISOString(),
  }, { onConflict: 'user_id,lesson_id' });

  if (error) {
    console.error('completeLesson error:', error);
    throw new Error(`Failed to complete lesson: ${error.message}`);
  }
}

export async function saveReflection(
  userId: string,
  lessonId: string,
  dayNumber: number,
  reflectionText: string,
  expectedUpdatedAt?: string | null
): Promise<void> {
  const supabase = await supabaseServer();

  if (!reflectionText.trim()) {
    const { error: deleteError } = await supabase
      .from('user_reflections')
      .delete()
      .eq('user_id', userId)
      .eq('lesson_id', lessonId);

    if (deleteError) {
      console.error('saveReflection delete error:', deleteError);
      throw new Error(`Failed to delete reflection: ${deleteError.message}`);
    }
    return;
  }

  if (expectedUpdatedAt) {
    const { data: existing } = await supabase
      .from('user_reflections')
      .select('updated_at')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single();

    if (existing && existing.updated_at !== expectedUpdatedAt) {
      throw new Error('Reflection was modified by another session. Refresh and try again.');
    }
  }

  const { error } = await supabase.from('user_reflections').upsert({
    user_id: userId,
    lesson_id: lessonId,
    day_number: dayNumber,
    reflection_text: reflectionText,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,lesson_id' });

  if (error) {
    console.error('saveReflection error:', error);
    throw new Error(`Failed to save reflection: ${error.message}`);
  }
}

export const getUserReflection = cache(async (
  userId: string,
  lessonId: string
): Promise<{ text: string | null; updatedAt: string | null }> => {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from('user_reflections')
    .select('reflection_text, updated_at')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single();
  return {
    text: data?.reflection_text ?? null,
    updatedAt: data?.updated_at ?? null,
  };
});
