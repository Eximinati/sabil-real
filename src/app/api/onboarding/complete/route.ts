import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { LANGUAGE_COOKIE_NAME, normalizeLanguage } from '@/lib/i18n/config';

const DEFAULT_EN_TRANSLATION_ID = 203;
const DEFAULT_UR_TRANSLATION_ID = 131;
const DEFAULT_TAFSIR_ID = 169;

export async function POST(request: Request) {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { completed, languageCode } = body;
    const language = normalizeLanguage(languageCode);

    const { data: existingPreferences } = await supabase
      .from('user_preferences')
      .select('translation_id, tafsir_id')
      .eq('user_id', user.id)
      .single();

    const fallbackTranslationId = language === 'ur' ? DEFAULT_UR_TRANSLATION_ID : DEFAULT_EN_TRANSLATION_ID;
    const translationId = existingPreferences?.translation_id ?? fallbackTranslationId;
    const tafsirId = existingPreferences?.tafsir_id ?? DEFAULT_TAFSIR_ID;

    await supabase.auth.updateUser({
      data: {
        preferred_language: language,
      },
    }).catch(() => {});

    // Upsert user preferences with onboarding completed
    const { error } = await supabase.from('user_preferences').upsert({
      user_id: user.id,
      translation_id: translationId,
      tafsir_id: tafsirId,
      onboarding_completed: completed === true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (error) {
      throw error;
    }

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
