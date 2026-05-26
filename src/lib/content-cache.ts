import { getApiUrl } from './api-url';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  saves: number;
}

const CACHE_TTL = {
  chapters: 7 * 24 * 60 * 60 * 1000, // 7 days
  translations: 24 * 60 * 60 * 1000, // 24 hours
  tafsirs: 24 * 60 * 60 * 1000, // 24 hours
  verses: 30 * 24 * 60 * 60 * 1000, // 30 days - verses rarely change
  audio: 7 * 24 * 60 * 60 * 1000, // 7 days
  hadith: 24 * 60 * 60 * 1000, // 24 hours
};

const contentCache: Record<string, Map<string | number, CacheEntry<any>>> = {
  chapters: new Map<string | number, CacheEntry<any>>(),
  translations: new Map<string | number, CacheEntry<any>>(),
  tafsirs: new Map<string | number, CacheEntry<any>>(),
  verses: new Map<string | number, CacheEntry<any>>(),
  audio: new Map<string | number, CacheEntry<any>>(),
  hadith: new Map<string | number, CacheEntry<any>>(),
};

const pendingRequests = new Map<string, Promise<any>>();

const stats: CacheStats = {
  hits: 0,
  misses: 0,
  saves: 0,
};

function getCacheEntry<T>(cache: Map<string | number, CacheEntry<T>>, key: string | number): { data: T | null; expired: boolean } {
  const entry = cache.get(key);
  if (!entry) return { data: null, expired: true };
  
  const ttlKey = typeof key === 'number' ? key.toString() : key;
  const isExpired = Date.now() - entry.timestamp > (CACHE_TTL[ttlKey as keyof typeof CACHE_TTL] || 86400000);
  if (isExpired) {
    cache.delete(key);
    return { data: null, expired: true };
  }
  
  return { data: entry.data, expired: false };
}

function setCacheEntry<T>(cache: Map<string | number, CacheEntry<T>>, key: string | number, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
  stats.saves++;
}

export function getCacheStats() {
  return { ...stats };
}

export function clearAllCaches() {
  contentCache.chapters.clear();
  contentCache.translations.clear();
  contentCache.tafsirs.clear();
  contentCache.verses.clear();
  contentCache.audio.clear();
  contentCache.hadith.clear();
  stats.hits = 0;
  stats.misses = 0;
  stats.saves = 0;
}

function getCacheKey(...parts: (string | number)[]): string {
  return parts.join(':');
}

export async function fetchCachedChapter(chapterId: number): Promise<any> {
  const cached = getCacheEntry(contentCache.chapters, chapterId);
  if (cached.data) {
    stats.hits++;
    return cached.data;
  }
  
  if (pendingRequests.has(`chapter:${chapterId}`)) {
    return pendingRequests.get(`chapter:${chapterId}`);
  }
  
  stats.misses++;
  const promise = fetch(getApiUrl(`/chapters`)).then(res => res.json());
  pendingRequests.set(`chapter:${chapterId}`, promise);
  
  const data = await promise;
  const chapters = Array.isArray(data) ? data : (data.chapters || []);
  const chapter = chapters.find((c: any) => c.id === chapterId);
  
  if (chapter) {
    setCacheEntry(contentCache.chapters, chapterId, chapter);
  }
  
  pendingRequests.delete(`chapter:${chapterId}`);
  return chapter;
}

export async function fetchCachedChapters(): Promise<any[]> {
  const key = 'all';
  const cached = getCacheEntry(contentCache.chapters, key);
  if (cached.data) {
    stats.hits++;
    return cached.data;
  }
  
  if (pendingRequests.has('chapters:all')) {
    return pendingRequests.get('chapters:all');
  }
  
  stats.misses++;
  const promise = fetch(getApiUrl('/chapters'), {
    next: { revalidate: CACHE_TTL.chapters / 1000 }
  }).then(res => res.json());
  
  pendingRequests.set('chapters:all', promise);
  
  const data = await promise;
  const chapters = Array.isArray(data) ? data : (data.chapters || []);
  
  for (const chapter of chapters) {
    setCacheEntry(contentCache.chapters, chapter.id, chapter);
  }
  setCacheEntry(contentCache.chapters, key, chapters);
  
  pendingRequests.delete('chapters:all');
  return chapters;
}

export async function fetchCachedTranslations(): Promise<any[]> {
  const key = 'all';
  const cached = getCacheEntry(contentCache.translations, key);
  if (cached.data) {
    stats.hits++;
    return cached.data;
  }
  
  if (pendingRequests.has('translations:all')) {
    return pendingRequests.get('translations:all');
  }
  
  stats.misses++;
  const promise = fetch(getApiUrl('/translations'), {
    next: { revalidate: CACHE_TTL.translations / 1000 }
  }).then(res => res.json());
  
  pendingRequests.set('translations:all', promise);
  
  const data = await promise;
  const translations = Array.isArray(data) ? data : (data.translations || []);
  
  setCacheEntry(contentCache.translations, key, translations);
  pendingRequests.delete('translations:all');
  return translations;
}

export async function fetchCachedVerse(verseKey: string, translationId: number = 203): Promise<any> {
  const cacheKey = getCacheKey(verseKey, translationId);
  const cached = getCacheEntry(contentCache.verses, cacheKey);
  if (cached.data) {
    stats.hits++;
    return cached.data;
  }
  
  if (pendingRequests.has(`verse:${cacheKey}`)) {
    return pendingRequests.get(`verse:${cacheKey}`);
  }
  
  stats.misses++;
  const promise = fetch(
    getApiUrl(`/verses/by_key/${verseKey}?translation=${translationId}`),
    { next: { revalidate: 60 } }
  ).then(res => res.json());
  
  pendingRequests.set(`verse:${cacheKey}`, promise);
  
  const data = await promise;
  setCacheEntry(contentCache.verses, cacheKey, data);
  pendingRequests.delete(`verse:${cacheKey}`);
  return data;
}

export async function fetchCachedVerses(
  verseKeys: string[], 
  translationId: number = 203
): Promise<any[]> {
  const cacheKeys = verseKeys.map(vk => getCacheKey(vk, translationId));
  
  const cached: any[] = [];
  const missing: { key: string; idx: number }[] = [];
  
  cacheKeys.forEach((key, idx) => {
    const entry = contentCache.verses.get(key);
    if (entry && !getCacheEntry(contentCache.verses, key).expired) {
      cached[idx] = entry.data;
    } else {
      missing.push({ key: verseKeys[idx], idx });
    }
  });
  
  if (missing.length > 0) {
    const missingKeys = missing.map(m => m.key);
    const promises = missingKeys.map(key => 
      fetch(getApiUrl(`/verses/by_key/${key}?translation=${translationId}`), { next: { revalidate: 60 } })
        .then(res => res.json())
    );
    
    const results = await Promise.all(promises);
    
    results.forEach((data, i) => {
      const cacheKey = getCacheKey(missing[i].key, translationId);
      setCacheEntry(contentCache.verses, cacheKey, data);
    });
    
    missing.forEach((m, i) => {
      cached[m.idx] = results[i];
    });
  }
  
  stats.hits += cached.filter(Boolean).length;
  stats.misses += missing.length;
  
  return cached;
}

export async function fetchCachedAudio(reciterId: number, chapterId: number): Promise<any[]> {
  const cacheKey = getCacheKey(reciterId, chapterId);
  const cached = getCacheEntry(contentCache.audio, cacheKey);
  if (cached.data) {
    stats.hits++;
    return cached.data;
  }
  
  if (pendingRequests.has(`audio:${cacheKey}`)) {
    return pendingRequests.get(`audio:${cacheKey}`);
  }
  
  stats.misses++;
  const promise = fetch(
    getApiUrl(`/audio/${reciterId}/${chapterId}`),
    { next: { revalidate: CACHE_TTL.audio / 1000 } }
  ).then(res => res.json());
  
  pendingRequests.set(`audio:${cacheKey}`, promise);
  
  const data = await promise;
  const audioFiles = data.audio_files || [];
  setCacheEntry(contentCache.audio, cacheKey, audioFiles);
  pendingRequests.delete(`audio:${cacheKey}`);
  return audioFiles;
}

export async function fetchCachedTafsir(tafsirId: number, chapterId: number): Promise<any> {
  const cacheKey = getCacheKey(tafsirId, chapterId);
  const cached = getCacheEntry(contentCache.tafsirs, cacheKey);
  if (cached.data) {
    stats.hits++;
    return cached.data;
  }
  
  if (pendingRequests.has(`tafsir:${cacheKey}`)) {
    return pendingRequests.get(`tafsir:${cacheKey}`);
  }
  
  stats.misses++;
  const promise = fetch(
    getApiUrl(`/tafsirs/${tafsirId}/${chapterId}`),
    { next: { revalidate: CACHE_TTL.tafsirs / 1000 } }
  ).then(res => res.json());
  
  pendingRequests.set(`tafsir:${cacheKey}`, promise);
  
  const data = await promise;
  setCacheEntry(contentCache.tafsirs, cacheKey, data);
  pendingRequests.delete(`tafsir:${cacheKey}`);
  return data;
}

export async function fetchCachedHadith(collection: string, number: number): Promise<any> {
  const cacheKey = getCacheKey(collection, number);
  const cached = getCacheEntry(contentCache.hadith, cacheKey);
  if (cached.data) {
    stats.hits++;
    return cached.data;
  }
  
  if (pendingRequests.has(`hadith:${cacheKey}`)) {
    return pendingRequests.get(`hadith:${cacheKey}`);
  }
  
  stats.misses++;
  const promise = fetch(getApiUrl(`/hadith/${collection}/${number}`)).then(res => res.json());
  
  pendingRequests.set(`hadith:${cacheKey}`, promise);
  
  const data = await promise;
  setCacheEntry(contentCache.hadith, cacheKey, data);
  pendingRequests.delete(`hadith:${cacheKey}`);
  return data;
}

export async function fetchCachedHadithByLanguage(
  collection: string,
  number: number,
  language: 'english' | 'urdu' = 'english'
): Promise<any> {
  const cacheKey = getCacheKey(collection, number, language);
  const cached = getCacheEntry(contentCache.hadith, cacheKey);
  if (cached.data) {
    stats.hits++;
    return cached.data;
  }

  if (pendingRequests.has(`hadith:${cacheKey}`)) {
    return pendingRequests.get(`hadith:${cacheKey}`);
  }

  stats.misses++;
  const promise = fetch(getApiUrl(`/hadith/${collection}/${number}?lang=${language}`)).then((res) => res.json());

  pendingRequests.set(`hadith:${cacheKey}`, promise);

  const data = await promise;
  setCacheEntry(contentCache.hadith, cacheKey, data);
  pendingRequests.delete(`hadith:${cacheKey}`);
  return data;
}

export function getCacheSizes() {
  return {
    chapters: contentCache.chapters.size,
    translations: contentCache.translations.size,
    tafsirs: contentCache.tafsirs.size,
    verses: contentCache.verses.size,
    audio: contentCache.audio.size,
    hadith: contentCache.hadith.size,
  };
}

export { CACHE_TTL };
