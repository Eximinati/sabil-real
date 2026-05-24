export const DEFAULT_TRANSLATION_ID = 203;

export const FALLBACK_TRANSLATIONS = [
  {
    id: DEFAULT_TRANSLATION_ID,
    name: 'Saheeh International',
    author_name: 'Saheeh International',
    language_name: 'English',
  },
];

export function isQfAccessDeniedError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /access denied/i.test(error.message) || /\b403\b/.test(error.message);
}
