import {
  DEFAULT_TAFSIR_ID,
  DEFAULT_TRANSLATION_ID,
} from './user-preferences';

export { DEFAULT_TAFSIR_ID, DEFAULT_TRANSLATION_ID };

export const FALLBACK_TRANSLATIONS = [
  {
    id: DEFAULT_TRANSLATION_ID,
    name: 'Saheeh International',
    author_name: 'Saheeh International',
    language_name: 'English',
  },
];

export const FALLBACK_TAFSIRS = [
  {
    id: DEFAULT_TAFSIR_ID,
    name: 'Tafsir Ibn Kathir',
    author_name: 'Ibn Kathir',
    language_name: 'English',
  },
];

export const FALLBACK_CHAPTERS = [
  { id: 2, name_simple: 'Al-Baqarah', name_arabic: 'البقرة', verses_count: 286, revelation_place: 'madinah' },
  { id: 39, name_simple: 'Az-Zumar', name_arabic: 'الزمر', verses_count: 75, revelation_place: 'makkah' },
  { id: 50, name_simple: 'Qaf', name_arabic: 'ق', verses_count: 45, revelation_place: 'makkah' },
  { id: 51, name_simple: 'Adh-Dhariyat', name_arabic: 'الذاريات', verses_count: 60, revelation_place: 'makkah' },
  { id: 67, name_simple: 'Al-Mulk', name_arabic: 'الملك', verses_count: 30, revelation_place: 'makkah' },
  { id: 93, name_simple: 'Ad-Duhaa', name_arabic: 'الضحى', verses_count: 11, revelation_place: 'makkah' },
  { id: 94, name_simple: 'Ash-Sharh', name_arabic: 'الشرح', verses_count: 8, revelation_place: 'makkah' },
  { id: 96, name_simple: 'Al-Alaq', name_arabic: 'العلق', verses_count: 19, revelation_place: 'makkah' },
];

export const FALLBACK_HADITH_COLLECTIONS = [
  { id: 'bukhari', name: 'Sahih al-Bukhari', arabic: 'صحيح البخاري' },
  { id: 'muslim', name: 'Sahih Muslim', arabic: 'صحيح مسلم' },
  { id: 'abudawud', name: 'Sunan Abu Dawud', arabic: 'سنن أبي داود' },
  { id: 'tirmidhi', name: "Jami' at-Tirmidhi", arabic: 'جامع الترمذي' },
  { id: 'nasai', name: "Sunan an-Nasa'i", arabic: 'سنن النسائي' },
  { id: 'ibnmajah', name: 'Sunan Ibn Majah', arabic: 'سنن ابن ماجه' },
  { id: 'malik', name: 'Muwatta Malik', arabic: 'موطأ مالك' },
];

export function normalizeApiErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Unknown error';
  }

  return error.message || 'Unknown error';
}

export function shouldFallbackFromError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    isQfAccessDeniedError(error) ||
    /qf api error:\s*(401|403|404|429|500|502|503|504)/i.test(message) ||
    /fetch failed|networkerror|timed out|econnreset|enotfound/i.test(message)
  );
}

export function isQfAccessDeniedError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /access denied/i.test(error.message) || /\b403\b/.test(error.message);
}
