'use client';

import { getApiUrl } from './api-url';

const LOG_PREFIX = '[Hadith Cache]';
const log =
  process.env.NODE_ENV === 'development'
    ? (msg: string) => console.log(`${LOG_PREFIX} ${msg}`)
    : () => {};

/* ─── Types ─────────────────────────────────────────────────── */

export interface HadithCacheEntry {
  collection: string;
  number: number;
  data: any;
  fetchedAt: number;
  ttl: number;
}

/* ─── Memory Limits ──────────────────────────────────────────── */

const MAX_MEMORY_HADITH = 300;

/* ─── LRU-safe Map helper ────────────────────────────────────── */

function lruSet<K, V>(map: Map<K, V>, key: K, value: V, max: number): void {
  if (map.has(key)) {
    map.delete(key);
  } else if (map.size >= max) {
    const first = map.keys().next().value;
    if (first !== undefined) map.delete(first);
  }
  map.set(key, value);
}

/* ─── Level 1: Memory Cache ─────────────────────────────────── */

type MemoryStore = {
  hadith: Map<string, HadithCacheEntry>;
};

let mem: MemoryStore | null = null;

function memStore(): MemoryStore {
  if (!mem) mem = { hadith: new Map() };
  return mem;
}

function cacheKey(collection: string, number: number): string {
  return `hadith:${collection}:${number}`;
}

function memGet(collection: string, number: number): HadithCacheEntry | undefined {
  return memStore().hadith.get(cacheKey(collection, number));
}

function memSet(entry: HadithCacheEntry): void {
  lruSet(memStore().hadith, cacheKey(entry.collection, entry.number), entry, MAX_MEMORY_HADITH);
}

export function resetMemoryCache(): void {
  mem = { hadith: new Map() };
}

export function getMemoryCacheSize(): number {
  return memStore().hadith.size;
}

/* ─── Level 2: Browser Cache (localForage) ──────────────────── */

import lf from './browser-cache';

const HADITH_TTL = 30 * 24 * 60 * 60 * 1000;

interface StoreEntry {
  data: HadithCacheEntry;
  ts: number;
  ttl: number;
}

async function lfGet(collection: string, number: number): Promise<HadithCacheEntry | null> {
  try {
    const entry = await lf.getItem<StoreEntry>(cacheKey(collection, number));
    if (!entry) return null;
    if (Date.now() - entry.ts > entry.ttl) {
      await lf.removeItem(cacheKey(collection, number));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

async function lfSet(entry: HadithCacheEntry): Promise<void> {
  try {
    await lf.setItem(cacheKey(entry.collection, entry.number), {
      data: entry,
      ts: Date.now(),
      ttl: entry.ttl || HADITH_TTL,
    });
  } catch {
    /* silent */
  }
}

/* ─── Hydration ──────────────────────────────────────────────── */

export async function hydrateCache(
  collection: string,
  number: number,
  data: any,
  ttl: number = HADITH_TTL
): Promise<void> {
  const entry: HadithCacheEntry = {
    collection,
    number,
    data,
    fetchedAt: Date.now(),
    ttl,
  };
  memSet(entry);
  await lfSet(entry);
}

async function browserHydrate(collection: string, number: number): Promise<boolean> {
  const cached = await lfGet(collection, number);
  if (cached) {
    memSet(cached);
    return true;
  }
  return false;
}

/* ─── Request Dedup ──────────────────────────────────────────── */

const inflight = new Map<string, Promise<any>>();

/* ─── Lazy cleanup init ─────────────────────────────────────── */

let cleanupStarted = false;

/* ─── Public API ────────────────────────────────────────────── */

export async function fetchHadith(
  collection: string,
  number: number
): Promise<any | null> {
  if (!cleanupStarted) {
    cleanupStarted = true;
    startPeriodicCleanup();
  }

  const key = cacheKey(collection, number);

  const fromMem = memGet(collection, number);
  if (fromMem) {
    log(`Memory hit ${key}`);
    return fromMem.data;
  }

  log(`Memory miss ${key}, checking browser`);
  const fromBrowser = await browserHydrate(collection, number);
  if (fromBrowser) {
    log(`Browser hit ${key}`);
    const entry = memGet(collection, number);
    return entry?.data ?? null;
  }

  const existing = inflight.get(key);
  if (existing) {
    log(`Dedup ${key}`);
    return existing;
  }

  log(`API miss ${key}`);
  const promise = (async () => {
    try {
      const res = await fetch(getApiUrl(`/hadith/${collection}/${number}`));
      if (!res.ok) {
        log(`API error ${key}: ${res.status}`);
        return null;
      }
      const data = await res.json();

      const entry: HadithCacheEntry = {
        collection,
        number,
        data,
        fetchedAt: Date.now(),
        ttl: HADITH_TTL,
      };

      memSet(entry);
      await lfSet(entry);
      return data;
    } catch (error) {
      log(`Fetch failed ${key}: ${error}`);
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/* ─── Periodic Cleanup ───────────────────────────────────────── */

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

export function startPeriodicCleanup(intervalMs = 600000): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    clearExpiredBrowserEntries().then((count) => {
      if (count > 0) log(`Cleaned ${count} expired browser entries`);
    });
  }, intervalMs);
}

export function stopPeriodicCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

/* ─── Cache Health ───────────────────────────────────────────── */

export function clearExpiredBrowserEntries(): Promise<number> {
  return new Promise((resolve) => {
    let cleared = 0;
    lf
      .iterate<StoreEntry, void>((value, key) => {
        if (Date.now() - value.ts > value.ttl) {
          lf.removeItem(key);
          cleared++;
        }
      })
      .then(() => resolve(cleared))
      .catch(() => resolve(cleared));
  });
}

export function clearAllCaches(): void {
  resetMemoryCache();
  lf
    .clear()
    .catch(() => {});
}
