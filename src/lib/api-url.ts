const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';

export function getApiUrl(path: string): string {
  return `${API_BASE}/api${path}`;
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

export default API_BASE;