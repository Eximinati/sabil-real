'use client';

import localforage from 'localforage';

const ARABIC_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const TRANSLATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

let store: typeof localforage | null = null;

function getStore(): typeof localforage {
  if (!store) {
    store = localforage.createInstance({
      name: 'quran-cache',
      version: 1,
      storeName: 'verses',
    });
  }
  return store;
}

function log(msg: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Quran Cache] ${msg}`);
  }
}

export async function getBrowserCachedItem<T>(key: string): Promise<T | null> {
  try {
    const entry = await getStore().getItem<CacheEntry>(key);
    if (!entry) {
      return null;
    }
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      await getStore().removeItem(key);
      log(`Expired: ${key}`);
      return null;
    }
    return entry.data as T;
  } catch {
    return null;
  }
}

export async function setBrowserCacheItem(key: string, data: unknown, type: 'verse' | 'translation'): Promise<void> {
  const ttl = type === 'verse' ? ARABIC_TTL_MS : TRANSLATION_TTL_MS;
  const entry: CacheEntry = { data, timestamp: Date.now(), ttl };
  try {
    await getStore().setItem(key, entry);
  } catch {
    // localForage may fail in private browsing mode
  }
}

export async function hasBrowserCachedItem(key: string): Promise<boolean> {
  try {
    const entry = await getStore().getItem<CacheEntry>(key);
    if (!entry) return false;
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      await getStore().removeItem(key);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function clearBrowserCache(): Promise<void> {
  try {
    await getStore().clear();
  } catch {
    // ignore
  }
}
