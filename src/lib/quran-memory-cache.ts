'use client';

export interface CachedVerse {
  verseKey: string;
  textUthmani: string;
  chapterName: string;
  audioUrl?: string;
  timestamp: number;
}

export interface CachedTranslation {
  verseKey: string;
  translationId: number;
  text: string;
  timestamp: number;
}

type MemoryStore = {
  verses: Map<string, CachedVerse>;
  translations: Map<string, CachedTranslation>;
};

function verseKey(k: string): string {
  return `verse:${k}`;
}

function translationKey(vk: string, tid: number): string {
  return `trans:${vk}:${tid}`;
}

let instance: MemoryStore | null = null;

function getStore(): MemoryStore {
  if (!instance) {
    instance = { verses: new Map(), translations: new Map() };
  }
  return instance;
}

export function resetMemoryCache(): void {
  instance = { verses: new Map(), translations: new Map() };
}

export function getCachedVerse(verseKey: string): CachedVerse | undefined {
  return getStore().verses.get(verseKey);
}

export function setCachedVerse(vk: string, data: Omit<CachedVerse, 'timestamp'>): void {
  getStore().verses.set(vk, { ...data, timestamp: Date.now() });
}

export function hasCachedVerse(verseKey: string): boolean {
  return getStore().verses.has(verseKey);
}

export function areAllVersesCached(verseKeys: string[]): boolean {
  return verseKeys.every((k) => getStore().verses.has(k));
}

export function getCachedTranslation(verseKey: string, translationId: number): CachedTranslation | undefined {
  return getStore().translations.get(translationKey(verseKey, translationId));
}

export function setCachedTranslation(
  verseKey: string,
  translationId: number,
  text: string
): void {
  getStore().translations.set(translationKey(verseKey, translationId), {
    verseKey,
    translationId,
    text,
    timestamp: Date.now(),
  });
}

export function areAllTranslationsCached(verseKeys: string[], translationId: number): boolean {
  return verseKeys.every((k) => getStore().translations.has(translationKey(k, translationId)));
}

export function getMemoryCacheSize(): { verses: number; translations: number } {
  return {
    verses: getStore().verses.size,
    translations: getStore().translations.size,
  };
}
