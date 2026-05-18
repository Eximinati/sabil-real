import { VerseReaderClient } from '@/components/verse-reader-client';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserPreferences } from '@/lib/journey';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ translation?: string }>;
}

export const dynamic = 'force-dynamic';

interface Verse {
  id: number;
  verse_key: string;
  text_uthmani: string;
  translations: Array<{
    text: string;
    resource_id: number;
    resource_name: string;
  }>;
}

interface ChapterData {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  revelation_place: string;
}

const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';

export default async function ChapterPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { translation: urlTranslation } = await searchParams;
  const chapterId = parseInt(id, 10);

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  let defaultTranslationId = 203;
  if (user) {
    const prefs = await getUserPreferences(user.id);
    defaultTranslationId = prefs.translation_id;
  }

  const translationId = urlTranslation || defaultTranslationId.toString();

  let chapter: ChapterData | null = null;
  let verses: Verse[] = [];
  let error: string | null = null;
  let translations: Array<{ id: number; name: string; author_name: string; language_name: string }> = [];

  try {
    const [chapterRes, versesRes, translationsRes] = await Promise.all([
      fetch(`${API_BASE}/api/chapters`, { cache: 'no-store' }),
      fetch(`${API_BASE}/api/verses/${chapterId}?translation=${translationId}`, { cache: 'no-store' }),
      fetch(`${API_BASE}/api/translations`, { cache: 'no-store' }),
    ]);

    const chapterData = await chapterRes.json();
    const versesData = await versesRes.json();
    const translationsData = await translationsRes.json();

    const chaptersList = chapterData.chapters ?? chapterData;
    chapter = chaptersList.find((c: ChapterData) => c.id === chapterId);
    verses = versesData.verses ?? [];
    translations = translationsData.translations ?? translationsData;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to fetch chapter';
  }

  const selectedTranslation = translations.find(
    (t: { id: number }) => t.id === parseInt(translationId, 10)
  );
  const translatorLabel = selectedTranslation
    ? `${selectedTranslation.author_name} (${selectedTranslation.language_name})`
    : 'Translation';

  const prevChapter = chapterId > 1 ? chapterId - 1 : null;
  const nextChapter = chapterId < 114 ? chapterId + 1 : null;

  if (error) {
    return (
      <div className="md:ml-[240px] min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
          <p className="text-[var(--color-error)] mb-4">{error}</p>
          <a href="/quran" className="text-[var(--color-primary)] hover:underline">
            ← Back to Surah list
          </a>
        </div>
      </div>
    );
  }

  return (
    <VerseReaderClient
      verses={verses}
      chapterId={chapterId}
      chapterName={chapter?.name_simple || ''}
      chapterNameArabic={chapter?.name_arabic || ''}
      versesCount={chapter?.verses_count || verses.length}
      revelationPlace={chapter?.revelation_place || 'Meccan'}
      translatorLabel={translatorLabel}
      translationId={parseInt(translationId, 10)}
      prevChapter={prevChapter}
      nextChapter={nextChapter}
    />
  );
}