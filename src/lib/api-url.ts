function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
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