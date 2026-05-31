import { metadataStore } from './metadata-store';
import { DEFAULT_TRANSLATION_ID } from './user-preferences';

const API_BASE = '';

export interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  revelation_place: string;
}

export interface Translation {
  id: number;
  name: string;
  author_name: string;
  language_name: string;
}

export interface Tafsir {
  id: number;
  name: string;
  author_name: string | null;
  language_name: string;
}

export interface HadithCollection {
  id: string;
  name: string;
  arabic: string;
}

async function safeFetch<T>(
  url: string,
  fallback: T
): Promise<T> {
  try {
    const data = await metadataStore.fetch<T>(url, {
      cache: true,
      expiresIn: 3600000,
    });

    return data ?? fallback;
  } catch (error) {
    console.error(`Metadata fetch failed: ${url}`, error);
    return fallback;
  }
}

export async function getCachedChapters(): Promise<Chapter[]> {
  const data = await safeFetch<{ chapters?: Chapter[] }>(
    `${API_BASE}/api/chapters`,
    {}
  );

  return data?.chapters ?? [];
}

export async function getCachedTranslations(): Promise<Translation[]> {
  const data = await safeFetch<{ translations?: Translation[] }>(
    `${API_BASE}/api/translations`,
    {}
  );

  return data?.translations ?? [];
}

export async function getCachedTafsirs(): Promise<Tafsir[]> {
  const data = await safeFetch<{ tafsirs?: Tafsir[] }>(
    `${API_BASE}/api/tafsirs`,
    {}
  );

  return data?.tafsirs ?? [];
}

export async function getCachedHadithCollections(): Promise<HadithCollection[]> {
  const data = await safeFetch<{ collections?: HadithCollection[] }>(
    `${API_BASE}/api/hadith/collections`,
    {}
  );

  return data?.collections ?? [];
}

export async function getCachedChapter(
  chapterId: number
): Promise<Chapter | null> {
  const chapters = await getCachedChapters();
  return chapters.find((c) => c.id === chapterId) ?? null;
}

export async function getCachedTranslation(
  translationId: number
): Promise<Translation | null> {
  const translations = await getCachedTranslations();
  return translations.find((t) => t.id === translationId) ?? null;
}

export async function getCachedTafsir(
  tafsirId: number
): Promise<Tafsir | null> {
  const tafsirs = await getCachedTafsirs();
  return tafsirs.find((t) => t.id === tafsirId) ?? null;
}

export async function getCachedVerses(
  chapterId: number,
  translationId: number = DEFAULT_TRANSLATION_ID
) {
  return safeFetch(
    `${API_BASE}/api/verses/${chapterId}?translation=${translationId}`,
    null
  );
}

export async function getCachedTafsirContent(
  tafsirId: number,
  chapterId: number
) {
  return safeFetch(
    `${API_BASE}/api/tafsirs/${tafsirId}/${chapterId}`,
    null
  );
}

export async function getCachedHadith(
  collection: string,
  number: string,
  language?: 'english' | 'urdu'
) {
  const languageParam = language ? `&lang=${language}` : '';
  return safeFetch(
    `${API_BASE}/api/hadith/${collection}/${number}${languageParam}`,
    null
  );
}

export function invalidateAllMetadata() {
  metadataStore.invalidate();
}

export function getMetadataStats() {
  return metadataStore.getStats();
}

export function getMetadataLog() {
  return metadataStore.getLog();
}

export function clearMetadataLog() {
  metadataStore.clearLog();
}
