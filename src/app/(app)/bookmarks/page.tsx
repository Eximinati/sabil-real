import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { getApiUrl } from '@/lib/api-url';
import { BookmarksClient } from './bookmarks-client';
import {
  getDefaultTranslationIdFromPreferenceLanguage,
  isMissingColumnError,
  normalizeTranslationId,
} from '@/lib/user-preferences';

export const dynamic = 'force-dynamic';

interface Bookmark {
  id: string;
  surah_id: number;
  verse_number: number;
  created_at: string;
}

interface ChapterData {
  id: number;
  name_simple: string;
  name_arabic: string;
}

interface EnrichedBookmark {
  id: string;
  surah_id: number;
  verse_number: number;
  created_at: string;
  chapterName: string;
  chapterNameArabic: string;
  verseText: string;
  translationText: string;
}

async function getChapters(): Promise<ChapterData[]> {
  try {
    const res = await fetch(getApiUrl('/chapters'), { next: { revalidate: 3600 } });
    const data = await res.json();
    return data.chapters ?? data;
  } catch {
    return [];
  }
}

async function getVersesBatch(
  surahIds: number[],
  translationId: number
): Promise<Map<string, any>> {
  const versesMap = new Map<string, any>();
  
  const uniqueSurahIds = [...new Set(surahIds)];
  
  const results = await Promise.all(
    uniqueSurahIds.map(async (surahId) => {
      try {
        const res = await fetch(getApiUrl(`/verses/${surahId}?translation=${translationId}`), {
          next: { revalidate: 300 } 
        });
        const data = await res.json();
        return { surahId, verses: data.verses ?? [] };
      } catch {
        return { surahId, verses: [] };
      }
    })
  );
  
  for (const result of results) {
    for (const verse of result.verses) {
      const verseNum = parseInt(verse.verse_key.split(':')[1], 10);
      versesMap.set(`${result.surahId}:${verseNum}`, verse);
    }
  }
  
  return versesMap;
}

async function getBookmarks(): Promise<EnrichedBookmark[]> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: bookmarks, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !bookmarks || bookmarks.length === 0) {
    return [];
  }

  let preferences: { translation_id?: number | null; ui_language?: string | null } | null = null;

  const { data: preferenceData, error: preferenceError } = await supabase
    .from('user_preferences')
    .select('translation_id, ui_language')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!preferenceError) {
    preferences = preferenceData;
  } else if (!isMissingColumnError(preferenceError)) {
    throw preferenceError;
  } else {
    const { data: legacyPreferenceData } = await supabase
      .from('user_preferences')
      .select('translation_id')
      .eq('user_id', user.id)
      .maybeSingle();

    preferences = legacyPreferenceData;
  }

  const fallbackTranslation = getDefaultTranslationIdFromPreferenceLanguage(
    preferences?.ui_language === 'en' || preferences?.ui_language === 'ur'
      ? preferences.ui_language
      : 'auto'
  );
  const translationId = normalizeTranslationId(preferences?.translation_id, fallbackTranslation);

  const surahIds = bookmarks.map(b => b.surah_id);
  const chapters = await getChapters();
  const versesMap = await getVersesBatch(surahIds, translationId);

  const enrichedBookmarks: EnrichedBookmark[] = bookmarks.map((bookmark) => {
    const chapter = chapters.find((c: ChapterData) => c.id === bookmark.surah_id);
    const verseKey = `${bookmark.surah_id}:${bookmark.verse_number}`;
    const verse = versesMap.get(verseKey);

    return {
      ...bookmark,
      chapterName: chapter?.name_simple || `Surah ${bookmark.surah_id}`,
      chapterNameArabic: chapter?.name_arabic || '',
      verseText: verse?.text_uthmani || '',
      translationText: verse?.translations?.[0]?.text || '',
    };
  });

  return enrichedBookmarks;
}

export default async function BookmarksPage() {
  const enrichedBookmarks = await getBookmarks();

  return <BookmarksClient bookmarks={enrichedBookmarks} />;
}
