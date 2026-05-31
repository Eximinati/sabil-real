export const SUPPORTED_LANGUAGES = ['en', 'ur'] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const LANGUAGE_COOKIE_NAME = 'sabil-language';
export const LANGUAGE_STORAGE_KEY = 'sabil-language';
export const JOURNEY_LANGUAGE_COOKIE_NAME = 'sabil-journey-language';

export function isSupportedLanguage(value: string | null | undefined): value is LanguageCode {
  if (!value) return false;
  return SUPPORTED_LANGUAGES.includes(value as LanguageCode);
}

export function normalizeLanguage(value: string | null | undefined): LanguageCode {
  if (!value) return DEFAULT_LANGUAGE;
  const lowered = value.toLowerCase();
  return isSupportedLanguage(lowered) ? lowered : DEFAULT_LANGUAGE;
}
