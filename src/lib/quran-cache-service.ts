'use client';

import { getApiUrl } from './api-url';

const LOG_PREFIX = '[Quran Cache]';
const log =
  process.env.NODE_ENV === 'development'
    ? (msg: string) => console.log(`${LOG_PREFIX} ${msg}`)
    : () => {};

/* ─── Types ─────────────────────────────────────────────────── */

export interface VerseCacheEntry {
  verseKey: string;
  textUthmani: string;
  chapterName: string;
}

export interface TranslationCacheEntry {
  verseKey: string;
  translationId: number;
  text: string;
}

export interface AudioCacheEntry {
  verseKey: string;
  reciterId: number;
  url: string;
}

interface ApiVerseData {
  verse_key: string;
  text_uthmani: string;
  translations?: Array<{ resource_name: string; text: string }>;
  [key: string]: unknown;
}

interface ApiResponseItem {
  verse: ApiVerseData | null;
  chapterName: string;
  verseKey: string;
  audioUrl?: string;
}

interface ApiResponse {
  verses?: ApiResponseItem[];
}

export interface VerseResult {
  verseKey: string;
  textUthmani: string;
  chapterName: string;
  audioUrl?: string;
  translationText?: string;
}

/* ─── Memory Limits ──────────────────────────────────────────── */

const MAX_MEMORY_VERSES = 2000;
const MAX_MEMORY_TRANSLATIONS = 2000;
const MAX_MEMORY_AUDIO = 2000;

/* ─── LRU-safe Map helpers ──────────────────────────────────── */

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
  verses: Map<string, VerseCacheEntry>;
  translations: Map<string, TranslationCacheEntry>;
  audio: Map<string, AudioCacheEntry>;
};

let mem: MemoryStore | null = null;

function memStore(): MemoryStore {
  if (!mem) mem = { verses: new Map(), translations: new Map(), audio: new Map() };
  return mem;
}

function vKey(k: string): string {
  return `verse:${k}`;
}
function tKey(vk: string, tid: number): string {
  return `trans:${vk}:${tid}`;
}
function aKey(vk: string, rid: number): string {
  return `audio:${vk}:${rid}`;
}

function memAllVerses(keys: string[]): boolean {
  return keys.every((k) => memStore().verses.has(vKey(k)));
}

function memAllTrans(keys: string[], tid: number): boolean {
  return keys.every((k) => memStore().translations.has(tKey(k, tid)));
}

function memGetVerse(k: string): VerseCacheEntry | undefined {
  return memStore().verses.get(vKey(k));
}
function memSetVerse(k: string, e: VerseCacheEntry): void {
  lruSet(memStore().verses, vKey(k), { ...e, verseKey: k }, MAX_MEMORY_VERSES);
}
function memGetTrans(k: string, tid: number): TranslationCacheEntry | undefined {
  return memStore().translations.get(tKey(k, tid));
}
function memSetTrans(k: string, tid: number, text: string): void {
  lruSet(memStore().translations, tKey(k, tid), {
    verseKey: k,
    translationId: tid,
    text,
  }, MAX_MEMORY_TRANSLATIONS);
}
function memGetAudio(k: string, rid: number): AudioCacheEntry | undefined {
  return memStore().audio.get(aKey(k, rid));
}
function memSetAudio(k: string, rid: number, url: string): void {
  lruSet(memStore().audio, aKey(k, rid), {
    verseKey: k,
    reciterId: rid,
    url,
  }, MAX_MEMORY_AUDIO);
}

export function resetMemoryCache(): void {
  mem = { verses: new Map(), translations: new Map(), audio: new Map() };
}

export function getMemoryCacheSizes() {
  const s = memStore();
  return {
    verses: s.verses.size,
    translations: s.translations.size,
    audio: s.audio.size,
  };
}

/* ─── Level 2: Browser Cache (localForage) ──────────────────── */

import lf from './browser-cache';

const AR_TTL = 30 * 24 * 60 * 60 * 1000;
const TRANS_TTL = 7 * 24 * 60 * 60 * 1000;
const AUDIO_TTL = 7 * 24 * 60 * 60 * 1000;

interface StoreEntry {
  data: unknown;
  ts: number;
  ttl: number;
}

async function lfGet<T>(k: string): Promise<T | null> {
  try {
    const entry = await lf.getItem<StoreEntry>(k);
    if (!entry) return null;
    if (Date.now() - entry.ts > entry.ttl) {
      await lf.removeItem(k);
      return null;
    }
    return entry.data as T;
  } catch {
    return null;
  }
}

async function lfSet(k: string, data: unknown, ttl: number): Promise<void> {
  try {
    await lf.setItem(k, { data, ts: Date.now(), ttl });
  } catch {
    /* silent */
  }
}

async function lfRemove(k: string): Promise<void> {
  try {
    await lf.removeItem(k);
  } catch {
    /* silent */
  }
}

async function browserHydrateVerses(keys: string[]): Promise<number> {
  let hit = 0;
  for (const k of keys) {
    if (memStore().verses.has(vKey(k))) continue;
    const cached = await lfGet<VerseCacheEntry>(vKey(k));
    if (cached) {
      memSetVerse(k, cached);
      hit++;
    }
  }
  return hit;
}

async function browserHydrateTrans(keys: string[], tid: number): Promise<number> {
  let hit = 0;
  for (const k of keys) {
    if (memStore().translations.has(tKey(k, tid))) continue;
    const cached = await lfGet<TranslationCacheEntry>(tKey(k, tid));
    if (cached) {
      memSetTrans(k, tid, cached.text);
      hit++;
    }
  }
  return hit;
}

async function browserHydrateAudio(keys: string[], rid: number): Promise<number> {
  let hit = 0;
  for (const k of keys) {
    if (memStore().audio.has(aKey(k, rid))) continue;
    const cached = await lfGet<AudioCacheEntry>(aKey(k, rid));
    if (cached) {
      memSetAudio(k, rid, cached.url);
      hit++;
    }
  }
  return hit;
}

/* ─── Request Dedup ──────────────────────────────────────────── */

const inflight = new Map<string, Promise<ApiResponse>>();

function dedupedFetch(path: string): Promise<ApiResponse> {
  const key = `fetch:${path}`;
  const existing = inflight.get(key);
  if (existing) {
    log(`Dedup: ${path}`);
    return existing;
  }
  const p = (async () => {
    const res = await fetch(getApiUrl(path));
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json() as Promise<ApiResponse>;
  })();
  inflight.set(key, p);
  p.finally(() => inflight.delete(key));
  return p;
}

/* ─── Audio URL normalization ────────────────────────────────── */

const QURAN_AUDIO_BASE = 'https://verses.quran.foundation';

function normalizeAudioUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl.replace('cdn.quran.com', 'verses.quran.foundation');
  }
  return `${QURAN_AUDIO_BASE}/${rawUrl}`;
}

/* ─── Main Orchestrator ─────────────────────────────────────── */

async function ensureVerses(keys: string[], reciterId?: number): Promise<void> {
  const missing = keys.filter((k) => !memStore().verses.has(vKey(k)));
  if (missing.length === 0) {
    log(`Memory hit all ${keys.length} verses`);
    return;
  }

  const browserHit = await browserHydrateVerses(missing);
  if (browserHit > 0) log(`Browser hit ${browserHit} verses`);

  const stillMissing = keys.filter((k) => !memStore().verses.has(vKey(k)));
  if (stillMissing.length === 0) return;

  let url = `/verses?verse_keys=${stillMissing.join(',')}&verses_only=true`;
  if (reciterId) url += `&reciter=${reciterId}`;

  log(`API miss ${stillMissing.length} verses: ${stillMissing.join(',')}`);
  const data = await dedupedFetch(url);

  if (!data.verses) return;

  for (const item of data.verses) {
    if (!item.verse) continue;
    const entry: VerseCacheEntry = {
      verseKey: item.verseKey,
      textUthmani: item.verse.text_uthmani || '',
      chapterName: item.chapterName,
    };
    memSetVerse(item.verseKey, entry);
    lfSet(vKey(item.verseKey), entry, AR_TTL);

    if (item.audioUrl && reciterId) {
      const audioUrl = normalizeAudioUrl(item.audioUrl);
      memSetAudio(item.verseKey, reciterId, audioUrl);
      lfSet(aKey(item.verseKey, reciterId), { verseKey: item.verseKey, reciterId, url: audioUrl }, AUDIO_TTL);
    }
  }
}

async function ensureTranslations(keys: string[], tid: number): Promise<void> {
  const missing = keys.filter((k) => !memStore().translations.has(tKey(k, tid)));
  if (missing.length === 0) {
    log(`Memory hit all ${keys.length} trans ${tid}`);
    return;
  }

  const browserHit = await browserHydrateTrans(missing, tid);
  if (browserHit > 0) log(`Browser hit ${browserHit} trans ${tid}`);

  const stillMissing = keys.filter((k) => !memStore().translations.has(tKey(k, tid)));
  if (stillMissing.length === 0) return;

  const param = stillMissing.join(',');
  log(`API miss ${stillMissing.length} trans ${tid}: ${param}`);
  const data = await dedupedFetch(`/verses?verse_keys=${param}&translation=${tid}&include_audio=false`);

  if (!data.verses) return;

  for (const item of data.verses) {
    const t = item.verse?.translations?.[0]?.text;
    if (t) {
      memSetTrans(item.verseKey, tid, t);
      lfSet(tKey(item.verseKey, tid), { verseKey: item.verseKey, translationId: tid, text: t }, TRANS_TTL);
    }
  }
}

/* ─── Audio Fetching ────────────────────────────────────────── */

export async function fetchAudio(
  verseKeys: string[],
  reciterId: number
): Promise<Record<string, string>> {
  if (verseKeys.length === 0) return {};

  const result: Record<string, string> = {};

  const missing: string[] = [];
  for (const vk of verseKeys) {
    const cached = memGetAudio(vk, reciterId);
    if (cached) {
      result[vk] = cached.url;
    } else {
      missing.push(vk);
    }
  }

  if (missing.length > 0) {
    const browserHit = await browserHydrateAudio(missing, reciterId);
    if (browserHit > 0) log(`Browser hit ${browserHit} audio entries`);
  }

  for (const vk of missing) {
    if (!result[vk]) {
      const cached = memGetAudio(vk, reciterId);
      if (cached) {
        result[vk] = cached.url;
      }
    }
  }

  const stillMissing = verseKeys.filter((vk) => !result[vk]);
  if (stillMissing.length === 0) return result;

  const param = stillMissing.join(',');
  log(`API miss ${stillMissing.length} audio entries`);
  const data = await dedupedFetch(`/verses?verse_keys=${param}&reciter=${reciterId}&verses_only=true`);

  if (data.verses) {
    for (const item of data.verses) {
      if (item.audioUrl) {
        const url = normalizeAudioUrl(item.audioUrl);
        memSetAudio(item.verseKey, reciterId, url);
        lfSet(aKey(item.verseKey, reciterId), { verseKey: item.verseKey, reciterId, url }, AUDIO_TTL);
        result[item.verseKey] = url;
      }
    }
  }

  return result;
}

export async function getAudioUrl(
  verseKey: string,
  reciterId: number
): Promise<string | null> {
  const cached = memGetAudio(verseKey, reciterId);
  if (cached) return cached.url;

  const browserCached = await lfGet<AudioCacheEntry>(aKey(verseKey, reciterId));
  if (browserCached) {
    memSetAudio(verseKey, reciterId, browserCached.url);
    return browserCached.url;
  }

  return null;
}

/* ─── Public API ────────────────────────────────────────────── */

export async function fetchVerses(
  verseKeys: string[],
  translationId: number,
  reciterId?: number
): Promise<{ verses: VerseResult[] }> {
  if (verseKeys.length === 0) return { verses: [] };

  const allCached = memAllVerses(verseKeys) && memAllTrans(verseKeys, translationId);

  if (!allCached) {
    await Promise.all([
      ensureVerses(verseKeys, reciterId),
      ensureTranslations(verseKeys, translationId),
    ]);
  }

  const verses = verseKeys.map((vk) => {
    const v = memGetVerse(vk);
    const t = memGetTrans(vk, translationId);
    const a = reciterId ? memGetAudio(vk, reciterId) : undefined;
    const chapterName = v?.chapterName || '';
    return {
      verseKey: vk,
      textUthmani: v?.textUthmani || '',
      chapterName,
      translationText: t?.text,
      audioUrl: a?.url,
    };
  });

  if (reciterId) {
    const missingAudio = verseKeys.filter((vk) => !memGetAudio(vk, reciterId));
    if (missingAudio.length > 0) {
      fetchAudio(missingAudio, reciterId).catch(() => {});
    }
  }

  return { verses };
}

export async function fetchTranslations(
  verseKeys: string[],
  translationId: number
): Promise<{ translations: TranslationCacheEntry[] }> {
  if (verseKeys.length === 0) return { translations: [] };

  const allCached = memAllTrans(verseKeys, translationId);
  if (!allCached) {
    const browserHit = await browserHydrateTrans(verseKeys, translationId);
    if (browserHit > 0) log(`Browser hit ${browserHit} trans ${translationId}`);

    const missing = verseKeys.filter((k) => !memStore().translations.has(tKey(k, translationId)));
    if (missing.length > 0) {
      await ensureTranslations(missing, translationId);
    }
  }

  return {
    translations: verseKeys
      .map((vk) => memGetTrans(vk, translationId))
      .filter((t): t is TranslationCacheEntry => t !== undefined),
  };
}

export async function getTranslationText(
  verseKey: string,
  translationId: number
): Promise<string | null> {
  const m = memGetTrans(verseKey, translationId);
  if (m) return m.text;

  const cached = await lfGet<TranslationCacheEntry>(tKey(verseKey, translationId));
  if (cached) {
    memSetTrans(verseKey, translationId, cached.text);
    return cached.text;
  }

  return null;
}

/* ─── Hydrate cache from pre-fetched data ────────────────────── */

export function hydrateVerses(
  verses: Array<{
    verse_key: string;
    text_uthmani: string;
    chapterName?: string;
  }>,
  chapterName?: string
): void {
  for (const v of verses) {
    memSetVerse(v.verse_key, {
      verseKey: v.verse_key,
      textUthmani: v.text_uthmani || '',
      chapterName: v.chapterName || chapterName || '',
    });
  }
}

export function hydrateAudio(
  verseKey: string,
  reciterId: number,
  url: string
): void {
  memSetAudio(verseKey, reciterId, normalizeAudioUrl(url));
}

export function hydrateTranslation(
  verseKey: string,
  translationId: number,
  text: string
): void {
  memSetTrans(verseKey, translationId, text);
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
