function parseBaseUrlCandidates(): string[] {
  const raw = process.env.NEXT_PUBLIC_BASE_URL || '';
  if (!raw) return [];

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => value.replace(/\/$/, ''));
}

function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  const candidates = parseBaseUrlCandidates();

  if (process.env.NODE_ENV !== 'production') {
    if (candidates.length > 0) {
      return candidates[0];
    }
    return 'http://localhost:3000';
  }

  if (candidates.length > 0) {
    const httpsCandidate = candidates.find((url) => url.startsWith('https://'));
    return httpsCandidate || candidates[0];
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
}

export function getApiUrl(path: string): string {
  const base = getBaseUrl();
  return `${base}/api${path}`;
}

export function getAbsoluteUrl(): string {
  return getBaseUrl();
}

export const API_URLS = {
  chapters: () => getApiUrl('/chapters'),
  verses: (chapterId: number) => getApiUrl(`/verses/${chapterId}`),
  translations: () => getApiUrl('/translations'),
  audio: (reciterId: number, chapterId: number) => getApiUrl(`/audio/${reciterId}/${chapterId}`),
  tafsirs: () => getApiUrl('/tafsirs'),
  tafsir: (tafsirId: number, chapterId: number) => getApiUrl(`/tafsirs/${tafsirId}/${chapterId}`),
  search: (query: string) => getApiUrl(`/search?q=${encodeURIComponent(query)}`),
  hadithCollections: () => getApiUrl('/hadith/collections'),
  hadith: (collection: string, number: number) => getApiUrl(`/hadith/${collection}/${number}`),
  journeyProgress: () => getApiUrl('/journey/progress'),
  journeyReflection: () => getApiUrl('/journey/reflection'),
  userPreferences: () => getApiUrl('/user/preferences'),
};

export default getAbsoluteUrl;
