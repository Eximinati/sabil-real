import type { LanguageCode } from '@/lib/i18n/config';

export type PreferenceLanguage = 'auto' | 'en' | 'ur';
export type HadithLanguagePreference = 'auto' | 'english' | 'urdu';

export const DEFAULT_EN_TRANSLATION_ID = 203;
export const DEFAULT_UR_TRANSLATION_ID = 131;
export const DEFAULT_TRANSLATION_ID = DEFAULT_EN_TRANSLATION_ID;
export const DEFAULT_TAFSIR_ID = 169;
export const DEFAULT_REMINDER_TIME = '20:30:00';

export function parsePreferenceLanguage(value: unknown): PreferenceLanguage {
  if (value === 'en' || value === 'ur') {
    return value;
  }

  return 'auto';
}

export function parseHadithLanguagePreference(value: unknown): HadithLanguagePreference {
  if (value === 'english' || value === 'urdu') {
    return value;
  }

  return 'auto';
}

export function resolveLanguagePreference(
  preference: PreferenceLanguage,
  fallbackLanguage: LanguageCode
): LanguageCode {
  if (preference === 'en' || preference === 'ur') {
    return preference;
  }

  return fallbackLanguage;
}

export function getDefaultTranslationIdForLanguage(language: LanguageCode): number {
  return language === 'ur' ? DEFAULT_UR_TRANSLATION_ID : DEFAULT_EN_TRANSLATION_ID;
}

export function getDefaultTranslationIdFromPreferenceLanguage(
  language: PreferenceLanguage | null | undefined
): number {
  return language === 'ur' ? DEFAULT_UR_TRANSLATION_ID : DEFAULT_EN_TRANSLATION_ID;
}

export function parsePositiveInt(value: unknown): number | null {
  const parsed = Number.parseInt(String(value ?? ''), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function normalizeTranslationId(value: unknown, fallback = DEFAULT_TRANSLATION_ID): number {
  return parsePositiveInt(value) || fallback;
}

export function isMissingColumnError(error: unknown): boolean {
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
