import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase-server';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  isSupportedLanguage,
  normalizeLanguage,
  type LanguageCode,
} from './config';
import { getDictionary } from './dictionary';

function parseAcceptLanguage(headerValue: string | null): LanguageCode | null {
  if (!headerValue) return null;

  const candidates = headerValue
    .split(',')
    .map((token) => token.trim().split(';')[0]?.toLowerCase())
    .filter(Boolean) as string[];

  for (const token of candidates) {
    const short = token.split('-')[0];
    if (isSupportedLanguage(short)) {
      return short;
    }
  }

  return null;
}

async function resolveUserPreferenceLanguage(): Promise<LanguageCode | null> {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data: preferences, error: preferenceError } = await supabase
      .from('user_preferences')
      .select('ui_language')
      .eq('user_id', user.id)
      .single();

    if (preferenceError) {
      return null;
    }

    const uiLanguage = preferences?.ui_language;
    if (isSupportedLanguage(uiLanguage)) {
      return uiLanguage;
    }

    return null;
  } catch {
    return null;
  }
}

export async function getServerLanguage(acceptLanguageHeader?: string | null): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get(LANGUAGE_COOKIE_NAME)?.value;

  if (isSupportedLanguage(cookieLanguage)) {
    return cookieLanguage;
  }

  const preferenceLanguage = await resolveUserPreferenceLanguage();
  if (preferenceLanguage) {
    return preferenceLanguage;
  }

  const fromHeader = parseAcceptLanguage(acceptLanguageHeader ?? null);
  if (fromHeader) {
    return fromHeader;
  }

  return DEFAULT_LANGUAGE;
}

export async function getServerDictionary(acceptLanguageHeader?: string | null) {
  const language = await getServerLanguage(acceptLanguageHeader);
  return {
    language,
    dictionary: await getDictionary(normalizeLanguage(language)),
  };
}
