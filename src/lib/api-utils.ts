import { metadataStore } from './metadata-store';

function getServerBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'http://localhost:3000';
  }
  return 'http://localhost:3000';
}

const API_BASE = getServerBaseUrl();

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

export async function getCachedChapters(): Promise<Chapter[]> {
  const data = await metadataStore.fetch<{ chapters?: Chapter[] }>(
    `${API_BASE}/api/chapters`,
    { cache: true, expiresIn: 3600000 }
  );
  return data?.chapters ?? [];
}

export async function getCachedTranslations(): Promise<Translation[]> {
  const data = await metadataStore.fetch<{ translations?: Translation[] }>(
    `${API_BASE}/api/translations`,
    { cache: true, expiresIn: 3600000 }
  );
  return data?.translations ?? [];
}

export async function getCachedTafsirs(): Promise<Tafsir[]> {
  const data = await metadataStore.fetch<{ tafsirs?: Tafsir[] }>(
    `${API_BASE}/api/tafsirs`,
    { cache: true, expiresIn: 3600000 }
  );
  return data?.tafsirs ?? [];
}

export async function getCachedHadithCollections(): Promise<HadithCollection[]> {
  const data = await metadataStore.fetch<{ collections?: HadithCollection[] }>(
    `${API_BASE}/api/hadith/collections`,
    { cache: true, expiresIn: 3600000 }
  );
  return data?.collections ?? [];
}

export async function getCachedChapter(chapterId: number): Promise<Chapter | null> {
  const chapters = await getCachedChapters();
  return chapters.find(c => c.id === chapterId) ?? null;
}

export async function getCachedTranslation(translationId: number): Promise<Translation | null> {
  const translations = await getCachedTranslations();
  return translations.find(t => t.id === translationId) ?? null;
}

export async function getCachedTafsir(tafsirId: number): Promise<Tafsir | null> {
  const tafsirs = await getCachedTafsirs();
  return tafsirs.find(t => t.id === tafsirId) ?? null;
}

export async function getCachedVerses(chapterId: number, translationId: number = 203) {
  const url = `${API_BASE}/api/verses/${chapterId}?translation=${translationId}`;
  return metadataStore.fetch(url, { cache: true, expiresIn: 300000 });
}

export async function getCachedTafsirContent(tafsirId: number, chapterId: number) {
  const url = `${API_BASE}/api/tafsirs/${tafsirId}/${chapterId}`;
  return metadataStore.fetch(url, { cache: true, expiresIn: 300000 });
}

export async function getCachedHadith(collection: string, number: string) {
  const url = `${API_BASE}/api/hadith/${collection}/${number}`;
  return metadataStore.fetch(url, { cache: true, expiresIn: 300000 });
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