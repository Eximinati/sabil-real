export function getApiUrl(path: string): string {
  // Use relative paths for client-side API calls (works on all environments)
  return `/api${path}`;
}

export function getAbsoluteUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Server-side: use NEXT_PUBLIC_BASE_URL or fallback
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://sabil.app';
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