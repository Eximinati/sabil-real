/**
 * Quran Foundation API Client
 * 
 * All functions are server-side only.
 * Use getQFToken() to get a valid access token before each request.
 */

import { getQFToken } from './qf-token';

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
  author_name: string;
  language_name: string;
}

export interface HadithReference {
  id: number;
  hadith_name: string;
  hadith_number: string;
  book_name: string;
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

async function qfFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
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
  
  console.log('Fetching verses:', QF_API_BASE + `/content/api/v4/verses/by_chapter/${chapterId}`, queryParams);
  const response = await qfFetch<VersesResponse>(`/content/api/v4/verses/by_chapter/${chapterId}`, queryParams);
  console.log('Verses response:', JSON.stringify(response).slice(0, 500));
  return response;
}

export async function getTranslations(): Promise<Translation[]> {
  const data = await qfFetch<{ translations: Translation[] }>('/content/api/v4/resources/translations');
  console.log('Translations response:', JSON.stringify(data).slice(0, 500));
  return data.translations;
}

export async function getTafsirs(): Promise<Tafsir[]> {
  return qfFetch<Tafsir[]>('/content/api/v4/resources/tafsirs');
}

export async function getTafsirForSurah(tafsirId: number, chapterId: number): Promise<unknown> {
  return qfFetch<unknown>(`/content/api/v4/tafsirs/${tafsirId}/by_chapter/${chapterId}`);
}

export async function getHadithReferences(verseKey: string): Promise<HadithReference[]> {
  return qfFetch<HadithReference[]>(`/content/api/v4/verses/${verseKey}/hadith-references`);
}

export async function searchQuran(
  query: string, 
  size: number = 10, 
  page: number = 1
): Promise<unknown> {
  return qfFetch<unknown>('/search/v4/search', {
    q: query,
    size: size.toString(),
    page: page.toString(),
  });
}