import { DEFAULT_TAFSIR_ID } from '@/lib/user-preferences';

export type TafsirLanguagePreference = 'auto' | 'en' | 'ur' | 'ar';

const TAFSIR_ID_KEY = 'sabil-tafsir-id';
const TAFSIR_LANG_KEY = 'sabil-tafsir-language';
const RECENT_TAFSIRS_KEY = 'sabil-recent-tafsirs';
const MAX_RECENT = 5;

/* ─── Current Scholar ─────────────────────────────────────────── */

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

/* ─── Recent Scholars ─────────────────────────────────────────── */

export function getRecentTafsirIds(): number[] {
  try {
    const stored = localStorage.getItem(RECENT_TAFSIRS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(Number).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function addRecentTafsirId(id: number) {
  try {
    const ids = getRecentTafsirIds().filter((i) => i !== id);
    ids.unshift(id);
    localStorage.setItem(RECENT_TAFSIRS_KEY, JSON.stringify(ids.slice(0, MAX_RECENT)));
  } catch {
  }
}

export function clearRecentTafsirIds() {
  try {
    localStorage.removeItem(RECENT_TAFSIRS_KEY);
  } catch {
  }
}

/* ─── Language Preference ─────────────────────────────────────── */

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

/* ─── Global Preference Service ────────────────────────────────── */

export interface PreferredTafsir {
  id: number;
  language: TafsirLanguagePreference;
}

export type TafsirPreferenceSource = 'localStorage' | 'server' | 'default';

export interface PreferredTafsirResult {
  tafsirId: number;
  language: TafsirLanguagePreference;
  source: TafsirPreferenceSource;
  displayName?: string;
}

export function getPreferredTafsir(): PreferredTafsir {
  return {
    id: getStoredTafsirId(),
    language: getStoredTafsirLanguage(),
  };
}

export function setPreferredTafsir(prefs: Partial<PreferredTafsir>) {
  if (prefs.id !== undefined) {
    setStoredTafsirId(prefs.id);
    addRecentTafsirId(prefs.id);
  }
  if (prefs.language !== undefined) {
    setStoredTafsirLanguage(prefs.language);
  }
}

export async function getPreferredTafsirWithName(): Promise<PreferredTafsirResult> {
  const { id, language } = getPreferredTafsir();
  const { resolveTafsirDisplayName } = await import('./tafsir-resource-registry');
  const displayName = await resolveTafsirDisplayName(id);
  return {
    tafsirId: id,
    language,
    source: 'localStorage',
    displayName,
  };
}
