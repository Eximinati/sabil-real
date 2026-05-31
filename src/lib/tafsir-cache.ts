import type { TafsirLanguagePreference } from '@/lib/tafsir-preferences';

export interface TafsirCacheEntry {
  tafsirId: number;
  chapterId: number;
  verses: TafsirCacheVerse[];
  fetchedAt: number;
  ttl: number;
}

export interface TafsirCacheVerse {
  verseNumber: number;
  text: string;
  resourceName: string;
}

export interface TafsirCacheConfig {
  defaultTtl: number;
  maxEntries: number;
  maxAge: number;
}

export interface TafsirFetchOptions {
  tafsirId: number;
  chapterId: number;
  preferredLanguage?: TafsirLanguagePreference;
  forceRefresh?: boolean;
}

export interface TafsirCacheService {
  get(options: TafsirFetchOptions): Promise<TafsirCacheEntry | null>;
  set(entry: TafsirCacheEntry): void;
  invalidate(tafsirId: number, chapterId: number): void;
  invalidateAll(): void;
}

export const DEFAULT_TAFSIR_CACHE_CONFIG: TafsirCacheConfig = {
  defaultTtl: 3600_000,
  maxEntries: 50,
  maxAge: 86400_000,
};
