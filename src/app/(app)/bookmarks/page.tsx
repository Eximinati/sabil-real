import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { getApiUrl } from '@/lib/api-url';
import { BookmarksClient } from './bookmarks-client';

export const dynamic = 'force-dynamic';

interface Bookmark {
  id: string;
  surah_id: number;
  verse_number: number;
  created_at: string;
}

async function getBookmarks(): Promise<Bookmark[]> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookmarks:', error);
    return [];
  }

  return data || [];
}

async function getChapters(): Promise<any[]> {
  try {
    const res = await fetch(getApiUrl('/chapters'), { cache: 'no-store' });
    const data = await res.json();
    return data.chapters ?? data;
  } catch {
    return [];
  }
}

async function getVerses(surahId: number, verseNumber: number): Promise<any | null> {
  try {
    const res = await fetch(getApiUrl(`/verses/${surahId}?translation=203`), { cache: 'no-store' });
    const data = await res.json();
    const verses = data.verses ?? [];
    return verses.find((v: any) => parseInt(v.verse_key.split(':')[1], 10) === verseNumber) || null;
  } catch {
    return null;
  }
}

export default async function BookmarksPage() {
  const bookmarks = await getBookmarks();
  const chapters = await getChapters();

  const enrichedBookmarks = await Promise.all(
    bookmarks.map(async (bookmark) => {
      const chapter = chapters.find((c: any) => c.id === bookmark.surah_id);
      const verse = await getVerses(bookmark.surah_id, bookmark.verse_number);
      return {
        ...bookmark,
        chapterName: chapter?.name_simple || `Surah ${bookmark.surah_id}`,
        chapterNameArabic: chapter?.name_arabic || '',
        verseText: verse?.text_uthmani || '',
        translationText: verse?.translations?.[0]?.text || '',
      };
    })
  );

  return <BookmarksClient bookmarks={enrichedBookmarks} />;
}