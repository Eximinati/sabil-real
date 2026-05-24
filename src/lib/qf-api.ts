/**
 * Quran Foundation API Client
 * 
 * All functions are server-side only.
 * Use getQFToken() to get a valid access token before each request.
 */

import { getQFToken, clearCachedToken } from './qf-token';

const QF_API_BASE = process.env.QF_API_BASE!;
const QF_CLIENT_ID = process.env.QF_CLIENT_ID!;

export interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  revelation_place: string;
}

export interface ChapterDetail extends Chapter {
  description: string;
}

export interface Verse {
  id: number;
  verse_key: string;
  text_uthmani: string;
  translations: Array<{
    text: string;
    resource_id: number;
    resource_name: string;
  }>;
}

export interface Translation {
  id: number;
  name: string;
  author_name: string;
  language_name: string;
}

export interface Tafsir {
  id: number;
  name: string;
  author_name: string | null;
  language_name: string;
}

export interface HadithReference {
  id: number;
  collection?: string;
  hadith_number?: string;
  our_hadith_number?: number;
  hadith_name?: string;
  book_name?: string;
}

export interface VersesResponse {
  verses: Verse[];
  pagination: {
    current_page: number;
    total_pages: number;
    per_page: number;
    total: number;
  };
}

async function qfFetch<T>(path: string, params?: Record<string, string>, retryOn401 = true): Promise<T> {
  const token = await getQFToken();

  const url = new URL(QF_API_BASE + path);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      'x-auth-token': token,
      'x-client-id': QF_CLIENT_ID,
    },
  });

  if (response.status === 401 && retryOn401) {
    clearCachedToken();
    return qfFetch<T>(path, params, false);
  }

  if (response.status === 403) {
    if (retryOn401) {
      clearCachedToken();
      return qfFetch<T>(path, params, false);
    }

    const targetHost = new URL(QF_API_BASE).host;
    throw new Error(`Access denied from ${targetHost}. Check QF client credentials and API base pairing.`);
  }

  if (response.status === 429) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return qfFetch<T>(path, params, retryOn401);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QF API error: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function getChapters(): Promise<Chapter[]> {
  const data = await qfFetch<{ chapters: Chapter[] }>('/content/api/v4/chapters');
  return data.chapters;
}

export async function getChapter(id: number): Promise<ChapterDetail> {
  return qfFetch<ChapterDetail>(`/content/api/v4/chapters/${id}`);
}

export async function getVerses(
  chapterId: number, 
  params?: { translations?: string; page?: number; per_page?: number }
): Promise<VersesResponse> {
  const queryParams: Record<string, string> = {
    words: 'false',
    translation_fields: 'text',
    fields: 'text_uthmani',
    per_page: '300',
  };
  
  if (params?.translations) {
    queryParams.translations = params.translations;
  }
  if (params?.page) {
    queryParams.page = params.page.toString();
  }
  if (params?.per_page) {
    queryParams.per_page = params.per_page.toString();
  }
  
  return qfFetch<VersesResponse>(`/content/api/v4/verses/by_chapter/${chapterId}`, queryParams);
}

export async function getTranslations(): Promise<Translation[]> {
  const data = await qfFetch<{ translations: Translation[] }>('/content/api/v4/resources/translations');
  return data.translations;
}

export async function getTafsirs(): Promise<Tafsir[]> {
  const data = await qfFetch<{ tafsirs: Tafsir[] }>('/content/api/v4/resources/tafsirs');
  return data.tafsirs ?? [];
}

export interface TafsirVerse {
  id: number;
  resource_id: number;
  verse_id: number;
  text: string;
  language_name: string;
  resource_name: string;
  verse_key: string;
  verse_number: number;
  chapter_id: number;
}

export interface Pagination {
  per_page: number;
  current_page: number;
  next_page: number | null;
  total_pages: number;
  total_records: number;
}

export interface TafsirResponse {
  tafsirs: TafsirVerse[];
  pagination: Pagination;
}

export async function getTafsirForSurah(
  tafsirId: number, 
  chapterId: number,
  page: number = 1
): Promise<TafsirResponse> {
  return qfFetch<TafsirResponse>(
    `/content/api/v4/tafsirs/${tafsirId}/by_chapter/${chapterId}`,
    { per_page: '50', page: page.toString() }
  );
}

export async function getHadithReferences(verseKey: string): Promise<HadithReference[]> {
  const data = await qfFetch<{ hadith_references: HadithReference[] }>(
    `/content/api/v4/verses/${verseKey}/hadith-references`
  );
  return data.hadith_references ?? [];
}

export interface HadithBody {
  lang: string;
  chapterNumber: string;
  chapterTitle: string;
  body: string;
  urn: number;
  grades: Array<{
    graded_by: string;
    grade: string;
  }>;
}

export interface Hadith {
  urn: number;
  collection: string;
  bookNumber: string;
  chapterId: string;
  hadithNumber: string;
  name: string;
  hadith: HadithBody[];
}

export interface HadithsResponse {
  hadiths: Hadith[];
  page: number;
  limit: number;
  has_more: boolean;
}

export async function getHadiths(
  verseKey: string,
  page: number = 1,
  language: string = 'en'
): Promise<HadithsResponse> {
  const data = await qfFetch<HadithsResponse>(
    `/content/api/v4/verses/${verseKey}/hadiths`,
    { page: page.toString(), limit: '5', language }
  );
  return data;
}

export interface SearchWord {
  text: string;
  highlight: boolean;
}

export interface SearchTranslation {
  text: string;
  highlighted: string;
  resource_name: string;
  language_name: string;
}

export interface SearchResult {
  verse_key: string;
  verse_id: number;
  text: string;
  highlighted: string;
  words: SearchWord[];
  translations: SearchTranslation[];
}

export interface AudioFile {
  verse_key: string;
  url: string;
  duration: string | null;
}

export interface RecitationResponse {
  audio_files: AudioFile[];
}

export async function getChapterRecitationAudio(
  recitationId: number,
  chapterNumber: number,
  perPage: number = 50
): Promise<AudioFile[]> {
  const data = await qfFetch<RecitationResponse>(
    `/content/api/v4/recitations/${recitationId}/by_chapter/${chapterNumber}`,
    {
      per_page: perPage.toString(),
      fields: 'verse_key,url,duration',
    }
  );
  return data.audio_files ?? [];
}

export interface SearchResponse {
  search: {
    query: string;
    total_results: number;
    current_page: number;
    total_pages: number;
    results: SearchResult[];
  };
}

export async function searchQuran(
  query: string,
  page: number = 1,
  size: number = 10,
  language: string = 'en',
  translationId: number = 131
): Promise<SearchResponse> {
  return qfFetch<SearchResponse>('/search/v4/search', {
    q: query,
    size: size.toString(),
    page: page.toString(),
    language,
    translations: translationId.toString(),
  });
}
