'use client';

import { getApiUrl } from './api-url';
import { FALLBACK_TAFSIRS } from './qf-fallbacks';

export interface TafsirResource {
  id: number;
  name: string;
  authorName: string;
  languageName: string;
}

interface ApiTafsir {
  id: number;
  name: string;
  author_name: string | null;
  language_name: string;
}

/* ─── Singleton Registry ─────────────────────────────────────── */

let cachedResources: TafsirResource[] | null = null;
let fetchPromise: Promise<TafsirResource[]> | null = null;

function normalize(api: ApiTafsir): TafsirResource {
  return {
    id: api.id,
    name: api.name,
    authorName: api.author_name || api.name,
    languageName: api.language_name || 'unknown',
  };
}

export async function discoverResources(): Promise<TafsirResource[]> {
  if (cachedResources) return cachedResources;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch(getApiUrl('/tafsirs'));
      const data = await res.json();
      const list: ApiTafsir[] = data.tafsirs || data || [];
      cachedResources = Array.isArray(list) ? list.map(normalize) : [];
      return cachedResources;
    } catch {
      cachedResources = FALLBACK_TAFSIRS.map(normalize);
      return cachedResources;
    }
  })();

  const result = await fetchPromise;
  fetchPromise = null;
  return result;
}

export async function discoverLanguages(): Promise<string[]> {
  const resources = await discoverResources();
  const langs = new Set(resources.map((r) => r.languageName.toLowerCase()));
  return Array.from(langs).sort();
}

export async function getResourceById(id: number): Promise<TafsirResource | undefined> {
  const resources = await discoverResources();
  return resources.find((r) => r.id === id);
}

export async function getResourcesByLanguage(lang: string): Promise<TafsirResource[]> {
  const resources = await discoverResources();
  return resources.filter((r) => r.languageName.toLowerCase() === lang.toLowerCase());
}

export async function getResourcesByLanguages(langs: string[]): Promise<TafsirResource[]> {
  const resources = await discoverResources();
  const lower = langs.map((l) => l.toLowerCase());
  return resources.filter((r) => lower.includes(r.languageName.toLowerCase()));
}

export async function recommendResources(
  preferredLanguage: string,
  limit = 5
): Promise<TafsirResource[]> {
  const resources = await discoverResources();
  const preferred = resources.filter(
    (r) => r.languageName.toLowerCase() === preferredLanguage.toLowerCase()
  );
  if (preferred.length >= limit) return preferred.slice(0, limit);
  return resources.slice(0, limit);
}

export function getFallbackResources(): TafsirResource[] {
  return FALLBACK_TAFSIRS.map(normalize);
}

export async function resolveTafsirDisplayName(id: number): Promise<string> {
  const resource = await getResourceById(id);
  return resource?.authorName || `Scholar #${id}`;
}

export async function validateTafsirId(id: number): Promise<number> {
  const resource = await getResourceById(id);
  return resource ? id : FALLBACK_TAFSIRS[0]?.id || 169;
}

export function invalidateRegistry(): void {
  cachedResources = null;
  fetchPromise = null;
}
