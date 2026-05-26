import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { LANGUAGE_COOKIE_NAME, normalizeLanguage } from '@/lib/i18n/config';

const DEFAULT_EN_TRANSLATION_ID = 203;
const DEFAULT_UR_TRANSLATION_ID = 131;
const DEFAULT_TAFSIR_ID = 169;

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { code?: string; message?: string };
  const message = (maybeError.message || '').toLowerCase();

  if (maybeError.code === 'PGRST204' || maybeError.code === '42703') {
    return true;
  }

  return (
    (message.includes('column') && message.includes('does not exist')) ||
    message.includes('schema cache')
  );
}

async function upsertPreferencesWithCompat(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  params: {
    userId: string;
    translationId: number;
    tafsirId: number;
    language: 'en' | 'ur';
    completed: boolean;
  }
) {
  const basePayload = {
    user_id: params.userId,
    translation_id: params.translationId,
    tafsir_id: params.tafsirId,
    updated_at: new Date().toISOString(),
  };

  const payloads = [
    {
      ...basePayload,
      ui_language: params.language,
      onboarding_completed: params.completed,
    },
    {
      ...basePayload,
      onboarding_completed: params.completed,
    },
    {
      ...basePayload,
      ui_language: params.language,
    },
    basePayload,
  ];

  let lastError: unknown = null;

  for (const payload of payloads) {
    const { error } = await supabase
      .from('user_preferences')
      .upsert(payload, { onConflict: 'user_id' });

    if (!error) {
      return;
    }

    lastError = error;

    if (!isMissingColumnError(error)) {
      throw error;
    }
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

    const body = await request.json().catch(() => ({}));
    const { completed, languageCode } = body as {
      completed?: unknown;
      languageCode?: string | null;
    };
    const language = normalizeLanguage(languageCode);

    const { data: existingPreferences, error: existingPreferencesError } = await supabase
      .from('user_preferences')
      .select('translation_id, tafsir_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingPreferencesError) {
      throw existingPreferencesError;
    }

    const fallbackTranslationId = language === 'ur' ? DEFAULT_UR_TRANSLATION_ID : DEFAULT_EN_TRANSLATION_ID;
    const translationId = existingPreferences?.translation_id ?? fallbackTranslationId;
    const tafsirId = existingPreferences?.tafsir_id ?? DEFAULT_TAFSIR_ID;

    await supabase.auth.updateUser({
      data: {
        preferred_language: language,
      },
    }).catch(() => {});

    await upsertPreferencesWithCompat(supabase, {
      userId: user.id,
      translationId,
      tafsirId,
      language,
      completed: completed === true,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(LANGUAGE_COOKIE_NAME, language, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
