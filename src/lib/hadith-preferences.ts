'use client';

export type HadithLanguagePreference = 'auto' | 'english' | 'urdu';

const HADITH_LANG_KEY = 'sabil-hadith-language';
const RECENT_HADITH_LANGS_KEY = 'sabil-recent-hadith-languages';
const MAX_RECENT = 5;

/* ─── Language Preference ──────────────────────────────────── */

export function getStoredHadithLanguage(): HadithLanguagePreference {
  try {
    const stored = localStorage.getItem(HADITH_LANG_KEY);
    if (stored === 'auto' || stored === 'english' || stored === 'urdu') {
      return stored;
    }
    return 'auto';
  } catch {
    return 'auto';
  }
}

export function setStoredHadithLanguage(lang: HadithLanguagePreference) {
  try {
    localStorage.setItem(HADITH_LANG_KEY, lang);
  } catch {
  }
}

export function resetPreferredHadithLanguage() {
  setStoredHadithLanguage('auto');
}

/* ─── Fallback Chain ───────────────────────────────────────── */

export type LanguageCode = 'en' | 'ur';

export function resolveHadithLanguage(
  preference: HadithLanguagePreference,
  uiLanguage: LanguageCode,
  journeyLanguage?: 'auto' | 'en' | 'ur'
): 'english' | 'urdu' {
  if (preference === 'english') return 'english';
  if (preference === 'urdu') return 'urdu';

  if (journeyLanguage === 'en') return 'english';
  if (journeyLanguage === 'ur') return 'urdu';

  if (uiLanguage === 'en') return 'english';
  if (uiLanguage === 'ur') return 'urdu';

  return 'english';
}

export function getPreferredHadithLanguage(): HadithLanguagePreference {
  return getStoredHadithLanguage();
}

export function setPreferredHadithLanguage(lang: HadithLanguagePreference) {
  setStoredHadithLanguage(lang);
  addRecentHadithLanguage(lang);
}

export function getPreferredHadithLanguageWithFallback(
  uiLanguage: LanguageCode,
  journeyLanguage?: 'auto' | 'en' | 'ur'
): 'english' | 'urdu' {
  const preference = getStoredHadithLanguage();
  return resolveHadithLanguage(preference, uiLanguage, journeyLanguage);
}

/* ─── Recent Languages ─────────────────────────────────────── */

export function getRecentHadithLanguages(): HadithLanguagePreference[] {
  try {
    const stored = localStorage.getItem(RECENT_HADITH_LANGS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((l: any) => l === 'auto' || l === 'english' || l === 'urdu')
      : [];
  } catch {
    return [];
  }
}

export function addRecentHadithLanguage(lang: HadithLanguagePreference) {
  try {
    const langs = getRecentHadithLanguages().filter((l) => l !== lang);
    langs.unshift(lang);
    localStorage.setItem(
      RECENT_HADITH_LANGS_KEY,
      JSON.stringify(langs.slice(0, MAX_RECENT))
    );
  } catch {
  }
}

export function clearRecentHadithLanguages() {
  try {
    localStorage.removeItem(RECENT_HADITH_LANGS_KEY);
  } catch {
  }
}

/* ─── Global Accessor ──────────────────────────────────────── */

export interface PreferredHadith {
  language: HadithLanguagePreference;
}

export interface PreferredHadithResult {
  language: HadithLanguagePreference;
  resolved: 'english' | 'urdu';
  source: 'localStorage' | 'default';
}

export function getPreferredHadith(): PreferredHadith {
  return {
    language: getStoredHadithLanguage(),
  };
}

export function getPreferredHadithWithFallback(
  uiLanguage: LanguageCode,
  journeyLanguage?: 'auto' | 'en' | 'ur'
): PreferredHadithResult {
  const language = getStoredHadithLanguage();
  const resolved = resolveHadithLanguage(language, uiLanguage, journeyLanguage);
  return {
    language,
    resolved,
    source: language !== 'auto' ? 'localStorage' : 'default',
  };
}
