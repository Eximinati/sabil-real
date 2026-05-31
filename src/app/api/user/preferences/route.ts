import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserPreferences } from '@/lib/journey';
import {
  DEFAULT_REMINDER_TIME,
  isMissingColumnError,
  parseHadithLanguagePreference,
  parsePreferenceLanguage,
  parsePositiveInt,
  type HadithLanguagePreference,
  type PreferenceLanguage,
} from '@/lib/user-preferences';

type ReminderLanguage = PreferenceLanguage;
type HadithLanguage = HadithLanguagePreference;
type UiLanguage = PreferenceLanguage;
type JourneyLanguage = PreferenceLanguage;

function parseReminderLanguage(value: unknown): ReminderLanguage {
  return parsePreferenceLanguage(value);
}

function parseHadithLanguage(value: unknown): HadithLanguage {
  return parseHadithLanguagePreference(value);
}

function parseUiLanguage(value: unknown): UiLanguage {
  return parsePreferenceLanguage(value);
}

function parseJourneyLanguage(value: unknown): JourneyLanguage {
  return parsePreferenceLanguage(value);
}

function parseReminderTime(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return DEFAULT_REMINDER_TIME;
  }

  const sanitized = value.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(sanitized)) {
    return sanitized;
  }

  if (/^\d{2}:\d{2}$/.test(sanitized)) {
    return `${sanitized}:00`;
  }

  return DEFAULT_REMINDER_TIME;
}

interface UserPreferencesUpsertPayload {
  user_id: string;
  translation_id: number;
  tafsir_id: number;
  hadith_language: HadithLanguage;
  ui_language: UiLanguage;
  journey_language: JourneyLanguage;
  reminders_enabled: boolean;
  reminder_time: string;
  reminder_language: ReminderLanguage;
  updated_at: string;
}

const COMPAT_OPTIONAL_COLUMNS = [
  'journey_language',
  'ui_language',
  'hadith_language',
  'reminders_enabled',
  'reminder_time',
  'reminder_language',
] as const;

function extractMissingColumnName(error: unknown): string | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const message = String((error as { message?: string }).message || '');
  const match =
    message.match(/column\s+['"]?([a-zA-Z0-9_]+)['"]?\s+does not exist/i) ||
    message.match(/Could not find the ['"]?([a-zA-Z0-9_]+)['"]? column/i);

  return match?.[1] || null;
}

async function upsertPreferencesWithCompat(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  payload: UserPreferencesUpsertPayload
): Promise<void> {
  const workingPayload: Record<string, unknown> = { ...payload };
  const removedColumns = new Set<string>();
  let lastError: unknown = null;

  for (let attempt = 0; attempt < COMPAT_OPTIONAL_COLUMNS.length + 1; attempt += 1) {
    const { error } = await supabase
      .from('user_preferences')
      .upsert(workingPayload, { onConflict: 'user_id' });

    if (!error) {
      return;
    }

    lastError = error;

    if (!isMissingColumnError(error)) {
      throw error;
    }

    const missingColumn = extractMissingColumnName(error);
    if (missingColumn && missingColumn in workingPayload) {
      delete workingPayload[missingColumn];
      removedColumns.add(missingColumn);
      continue;
    }

    const fallbackColumn = COMPAT_OPTIONAL_COLUMNS.find(
      (column) => !removedColumns.has(column) && column in workingPayload
    );

    if (!fallbackColumn) {
      break;
    }

    delete workingPayload[fallbackColumn];
    removedColumns.add(fallbackColumn);
  }

  if (lastError) {
    throw lastError;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      translationId,
      tafsirId,
      hadithLanguage,
      uiLanguage,
      journeyLanguage,
      remindersEnabled,
      reminderTime,
      reminderLanguage,
    } = body;

    const existingPreferences = await getUserPreferences(user.id);

    const parsedTranslationId =
      parsePositiveInt(translationId) || existingPreferences.translation_id;
    const parsedTafsirId =
      parsePositiveInt(tafsirId) || existingPreferences.tafsir_id;

    if (!parsedTranslationId || !parsedTafsirId) {
      return NextResponse.json({ error: 'Missing translationId or tafsirId' }, { status: 400 });
    }

    await upsertPreferencesWithCompat(supabase, {
      user_id: user.id,
      translation_id: parsedTranslationId,
      tafsir_id: parsedTafsirId,
      hadith_language:
        hadithLanguage === undefined
          ? existingPreferences.hadith_language
          : parseHadithLanguage(hadithLanguage),
      ui_language:
        uiLanguage === undefined
          ? existingPreferences.ui_language
          : parseUiLanguage(uiLanguage),
      journey_language:
        journeyLanguage === undefined
          ? existingPreferences.journey_language
          : parseJourneyLanguage(journeyLanguage),
      reminders_enabled:
        remindersEnabled === undefined
          ? existingPreferences.reminders_enabled
          : remindersEnabled === true,
      reminder_time:
        reminderTime === undefined
          ? parseReminderTime(existingPreferences.reminder_time)
          : parseReminderTime(reminderTime),
      reminder_language:
        reminderLanguage === undefined
          ? existingPreferences.reminder_language
          : parseReminderLanguage(reminderLanguage),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
