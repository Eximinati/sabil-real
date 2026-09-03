import { getApiUrl } from './api-url';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const HADITH_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const hadithCache = new Map<string, CacheEntry<any>>();
const pendingRequests = new Map<string, Promise<any>>();

function getCacheEntry<T>(key: string): T | null {
  const entry = hadithCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > HADITH_CACHE_TTL) {
    hadithCache.delete(key);
    return null;
  }

  return entry.data;
}

function setCacheEntry<T>(key: string, data: T): void {
  hadithCache.set(key, { data, timestamp: Date.now() });
}

function getCacheKey(...parts: (string | number)[]): string {
  return parts.join(':');
}

export async function fetchCachedHadith(collection: string, number: number): Promise<any> {
  const cacheKey = getCacheKey(collection, number);
  const cached = getCacheEntry(cacheKey);
  if (cached) return cached;

  if (pendingRequests.has(`hadith:${cacheKey}`)) {
    return pendingRequests.get(`hadith:${cacheKey}`);
  }

  const promise = fetch(getApiUrl(`/hadith/${collection}/${number}`)).then(res => res.json());
  pendingRequests.set(`hadith:${cacheKey}`, promise);

  try {
    const data = await promise;
    setCacheEntry(cacheKey, data);
    return data;
  } finally {
    pendingRequests.delete(`hadith:${cacheKey}`);
  }
}

export async function fetchCachedHadithByLanguage(
  collection: string,
  number: number,
  language: 'english' | 'urdu' = 'english'
): Promise<any> {
  const cacheKey = getCacheKey(collection, number, language);
  const cached = getCacheEntry(cacheKey);
  if (cached) return cached;

  if (pendingRequests.has(`hadith:${cacheKey}`)) {
    return pendingRequests.get(`hadith:${cacheKey}`);
  }

  const promise = fetch(getApiUrl(`/hadith/${collection}/${number}?lang=${language}`)).then((res) => res.json());
  pendingRequests.set(`hadith:${cacheKey}`, promise);

  try {
    const data = await promise;
    setCacheEntry(cacheKey, data);
    return data;
  } finally {
    pendingRequests.delete(`hadith:${cacheKey}`);
  }
}
