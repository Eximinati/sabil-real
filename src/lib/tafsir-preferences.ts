import { DEFAULT_TAFSIR_ID } from '@/lib/user-preferences';

export type TafsirLanguagePreference = 'auto' | 'en' | 'ur' | 'ar';

const TAFSIR_ID_KEY = 'sabil-tafsir-id';
const TAFSIR_LANG_KEY = 'sabil-tafsir-language';

export function getStoredTafsirId(): number {
  try {
    const stored = localStorage.getItem(TAFSIR_ID_KEY);
    if (!stored) return DEFAULT_TAFSIR_ID;
    const id = parseInt(stored, 10);
    return Number.isFinite(id) && id > 0 ? id : DEFAULT_TAFSIR_ID;
  } catch {
    return DEFAULT_TAFSIR_ID;
  }
}

export function setStoredTafsirId(id: number) {
  try {
    localStorage.setItem(TAFSIR_ID_KEY, id.toString());
  } catch {
  }
}

export function getStoredTafsirLanguage(): TafsirLanguagePreference {
  try {
    const stored = localStorage.getItem(TAFSIR_LANG_KEY);
    if (stored === 'auto' || stored === 'en' || stored === 'ur' || stored === 'ar') {
      return stored;
    }
    return 'auto';
  } catch {
    return 'auto';
  }
}

export function setStoredTafsirLanguage(lang: TafsirLanguagePreference) {
  try {
    localStorage.setItem(TAFSIR_LANG_KEY, lang);
  } catch {
  }
}
