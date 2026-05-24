import { VerseReaderClient } from '@/components/verse-reader-client';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserPreferences } from '@/lib/journey';
import { getApiUrl } from '@/lib/api-url';
import { getServerDictionary } from '@/lib/i18n/server';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ translation?: string }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export default async function ChapterPage({ params, searchParams }: PageProps) {
  const { dictionary: copy } = await getServerDictionary();
  const { id } = await params;
  const { translation: urlTranslation } = await searchParams;
  const chapterId = parseInt(id, 10);

  if (isNaN(chapterId) || chapterId < 1 || chapterId > 114) {
    return (
      <div className="md:ml-[240px] min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center p-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--color-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-2">{copy.quran.surahNotFoundTitle}</h2>
          <p className="text-[var(--color-text-muted)] text-sm mb-6">{copy.quran.surahNotFoundDescription}</p>
          <a href="/quran" className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-full hover:opacity-90 transition-opacity text-sm font-medium">
            ← {copy.quran.backToSurahList}
          </a>
        </div>
      </div>
    );
  }

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  let defaultTranslationId = 203;
  if (user) {
    const prefs = await getUserPreferences(user.id);
    defaultTranslationId = prefs.translation_id;
  }

  const translationId = urlTranslation || defaultTranslationId.toString();

  let chapter: any = null;
  let verses: any[] = [];
  let error: string | null = null;
  let translations: any[] = [];

  try {
    const [chapterRes, versesRes, translationsRes] = await Promise.all([
      fetch(getApiUrl('/chapters'), { next: { revalidate: 3600 } }),
      fetch(getApiUrl(`/verses/${chapterId}?translation=${translationId}`), { next: { revalidate: 300 } }),
      fetch(getApiUrl('/translations'), { next: { revalidate: 3600 } }),
    ]);

    const chapterData = await chapterRes.json();
    const versesData = await versesRes.json();
    const translationsData = await translationsRes.json();

    const chaptersList = chapterData.chapters ?? chapterData;
    chapter = chaptersList.find((c: any) => c.id === chapterId);
    verses = versesData.verses ?? [];
    translations = translationsData.translations ?? translationsData;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to fetch chapter';
  }

  const selectedTranslation = translations.find(
    (t: any) => t.id === parseInt(translationId, 10)
  );
  const translatorLabel = selectedTranslation
    ? `${selectedTranslation.author_name} (${selectedTranslation.language_name})`
    : 'Translation';

  const prevChapter = chapterId > 1 ? chapterId - 1 : null;
  const nextChapter = chapterId < 114 ? chapterId + 1 : null;

  if (error) {
    return (
      <div className="md:ml-[240px] min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center p-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--color-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-2">{copy.quran.couldNotLoadSurahTitle}</h2>
          <p className="text-[var(--color-text-muted)] text-sm mb-6">{copy.quran.couldNotLoadSurahDescription}</p>
          <a href="/quran" className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-full hover:opacity-90 transition-opacity text-sm font-medium">
            ← {copy.quran.backToSurahList}
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
