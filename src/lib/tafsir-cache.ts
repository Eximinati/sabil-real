'use client';

import { getApiUrl } from './api-url';

const LOG_PREFIX = '[Tafsir Cache]';
const log =
  process.env.NODE_ENV === 'development'
    ? (msg: string) => console.log(`${LOG_PREFIX} ${msg}`)
    : () => {};

/* ─── Types ─────────────────────────────────────────────────── */

export interface TafsirCacheVerse {
  id: number;
  verse_key: string;
  verse_number: number;
  text: string;
  resource_name?: string;
}

export interface TafsirCacheEntry {
  tafsirId: number;
  chapterId: number;
  verses: TafsirCacheVerse[];
  fetchedAt: number;
  ttl: number;
}

/* ─── Memory Limits ──────────────────────────────────────────── */

const MAX_MEMORY_TAFSIR = 300;

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
  tafsir: Map<string, TafsirCacheEntry>;
};

let mem: MemoryStore | null = null;

function memStore(): MemoryStore {
  if (!mem) mem = { tafsir: new Map() };
  return mem;
}

function cacheKey(tafsirId: number, chapterId: number): string {
  return `tafsir:${tafsirId}:${chapterId}`;
}

function memGet(tafsirId: number, chapterId: number): TafsirCacheEntry | undefined {
  return memStore().tafsir.get(cacheKey(tafsirId, chapterId));
}

function memSet(entry: TafsirCacheEntry): void {
  lruSet(memStore().tafsir, cacheKey(entry.tafsirId, entry.chapterId), entry, MAX_MEMORY_TAFSIR);
}

export function resetMemoryCache(): void {
  mem = { tafsir: new Map() };
}

export function getMemoryCacheSizes() {
  return { tafsir: memStore().tafsir.size };
}

/* ─── Level 2: Browser Cache (localForage) ──────────────────── */

import localforage from 'localforage';

const TAFSIR_TTL = 30 * 24 * 60 * 60 * 1000;

interface StoreEntry {
  data: TafsirCacheEntry;
  ts: number;
  ttl: number;
}

let lf: typeof localforage | null = null;

function lfStore(): typeof localforage {
  if (!lf) {
    lf = localforage.createInstance({
      name: 'tafsir-cache',
      version: 1,
      storeName: 'tafsir',
    });
  }
  return lf;
}

async function lfGet(tafsirId: number, chapterId: number): Promise<TafsirCacheEntry | null> {
  try {
    const entry = await lfStore().getItem<StoreEntry>(cacheKey(tafsirId, chapterId));
    if (!entry) return null;
    if (Date.now() - entry.ts > entry.ttl) {
      await lfStore().removeItem(cacheKey(tafsirId, chapterId));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

async function lfSet(entry: TafsirCacheEntry): Promise<void> {
  try {
    await lfStore().setItem(cacheKey(entry.tafsirId, entry.chapterId), {
      data: entry,
      ts: Date.now(),
      ttl: entry.ttl || TAFSIR_TTL,
    });
  } catch {
    /* silent */
  }
}

/* ─── Hydration ──────────────────────────────────────────────── */

export async function hydrateCache(
  tafsirId: number,
  chapterId: number,
  verses: TafsirCacheVerse[],
  ttl: number = TAFSIR_TTL
): Promise<void> {
  const entry: TafsirCacheEntry = {
    tafsirId,
    chapterId,
    verses,
    fetchedAt: Date.now(),
    ttl,
  };
  memSet(entry);
  await lfSet(entry);
}

export async function browserHydrate(tafsirId: number, chapterId: number): Promise<boolean> {
  const cached = await lfGet(tafsirId, chapterId);
  if (cached) {
    memSet(cached);
    return true;
  }
  return false;
}

/* ─── Request Dedup ──────────────────────────────────────────── */

const inflight = new Map<string, Promise<TafsirCacheEntry | null>>();

/* ─── Public API ────────────────────────────────────────────── */

export async function fetchTafsir(
  tafsirId: number,
  chapterId: number
): Promise<TafsirCacheEntry | null> {
  const key = cacheKey(tafsirId, chapterId);

  const fromMem = memGet(tafsirId, chapterId);
  if (fromMem) {
    log(`Memory hit ${key}`);
    return fromMem;
  }

  log(`Memory miss ${key}, checking browser`);
  const fromBrowser = await browserHydrate(tafsirId, chapterId);
  if (fromBrowser) {
    log(`Browser hit ${key}`);
    return memGet(tafsirId, chapterId) || null;
  }

  const existing = inflight.get(key);
  if (existing) {
    log(`Dedup ${key}`);
    return existing;
  }

  log(`API miss ${key}`);
  const promise = (async () => {
    try {
      const res = await fetch(getApiUrl(`/tafsirs/${tafsirId}/${chapterId}`));
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      const rawTafsirs: any[] = data.tafsirs || data || [];
      const verses: TafsirCacheVerse[] = Array.isArray(rawTafsirs)
        ? rawTafsirs.map((t: any) => ({
            id: t.id,
            verse_key: t.verse_key || '',
            verse_number: t.verse_number ??
              (t.verse_key ? (parseInt(t.verse_key.split(':')[1], 10) || 0) : 0),
            text: t.text || '',
            resource_name: t.resource_name,
          }))
        : [];

      const entry: TafsirCacheEntry = {
        tafsirId,
        chapterId,
        verses,
        fetchedAt: Date.now(),
        ttl: TAFSIR_TTL,
      };

      memSet(entry);
      await lfSet(entry);
      return entry;
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
    lfStore()
      .iterate<StoreEntry, void>((value, key) => {
        if (Date.now() - value.ts > value.ttl) {
          lfStore().removeItem(key);
          cleared++;
        }
      })
      .then(() => resolve(cleared))
      .catch(() => resolve(cleared));
  });
}

export function clearAllCaches(): void {
  resetMemoryCache();
  lfStore()
    .clear()
    .catch(() => {});
}
