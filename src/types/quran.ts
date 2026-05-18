export interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  revelation_place: string;
  description?: string;
}

export interface Verse {
  id: number;
  verse_key: string;
  verse_number?: number;
  text_uthmani: string;
  page_number?: number;
  hizb_number?: number;
  rub_el_hizb_number?: number;
  ruku_number?: number;
  manzil_number?: number;
  sajdah_number?: number | null;
  juz_number?: number;
  translations?: Translation[];
}

export interface Translation {
  id: number;
  resource_id: number;
  text: string;
  resource_name?: string;
}

export interface TranslationResource {
  id: number;
  name: string;
  author_name: string;
  language_name: string;
  slug?: string;
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

export interface HadithReference {
  id: number;
  collection?: string;
  hadith_number?: string;
  our_hadith_number?: number;
  hadith_name?: string;
  book_name?: string;
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

export interface HadithBody {
  lang: string;
  chapterNumber: string;
  chapterTitle: string;
  body: string;
  urn: number;
  grades?: Array<{
    graded_by: string;
    grade: string;
  }>;
}

export interface AudioFile {
  verse_key: string;
  url: string;
  duration: string | null;
}

export interface Reciter {
  id: number;
  name: string;
}

export interface SearchResult {
  verse_key: string;
  verse_id: number;
  text: string;
  highlighted?: string;
  translations?: Array<{
    text: string;
    resource_name: string;
    language_name: string;
  }>;
}

export interface JourneyDay {
  day: number;
  date: string;
  title?: string;
  verses?: string[];
  completed?: boolean;
}

export interface UserPreferences {
  translation_id: number;
  theme?: string;
  reciter_id?: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info';
}