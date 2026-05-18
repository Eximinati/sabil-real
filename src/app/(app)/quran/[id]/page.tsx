import { redirect } from 'next/navigation';
import { TranslationSelector } from '@/components/translation-selector';
import { ReciterSelector } from '@/components/reciter-selector';
import { SurahControls } from '@/components/surah-controls';
import { VerseCardClient } from '@/components/verse-card-client';
import { AudioPlayer } from '@/components/audio-player';
import Link from 'next/link';
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

  const showBismillah = chapterId !== 1 && chapterId !== 9;
  const prevChapter = chapterId > 1 ? chapterId - 1 : null;
  const nextChapter = chapterId < 114 ? chapterId + 1 : null;

  return (
    <div className="min-h-screen pb-48 md:pb-20">
      <div className="sticky top-0 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b border-[var(--color-border)] z-10">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/quran" className="text-[var(--color-primary)] hover:underline text-sm">
              ← Back
            </Link>
            <span className="text-[var(--color-text-muted)] hidden md:inline">|</span>
            <span className="text-[var(--color-text)] font-medium text-sm md:text-base">{chapter?.name_simple}</span>
            <span className="font-arabic text-[var(--color-accent)] mr-1 hidden md:inline" dir="rtl">{chapter?.name_arabic}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {chapter && (
              <span className="text-[var(--color-text-muted)] hidden sm:inline">{chapter.verses_count} verses</span>
            )}
            <SurahControls chapterId={chapterId} />
            <ReciterSelector />
            <TranslationSelector />
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 md:py-8">
        {error && (
          <div className="max-w-3xl mx-auto p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-[var(--color-error)] rounded-lg mb-6">
            {error}
          </div>
        )}

        {chapter && (
          <div className="text-center mb-8 max-w-3xl mx-auto">
            <span className="font-arabic text-[32px] md:text-[36px] text-[var(--color-accent)] block" dir="rtl">
              {chapter.name_arabic}
            </span>
            <h1 className="text-[var(--color-text)] text-xl font-medium mt-3">{chapter.name_simple}</h1>
          </div>
        )}

        {showBismillah && (
          <div className="text-center mb-8 max-w-3xl mx-auto">
            <p className="font-arabic text-[22px] md:text-[24px] text-[var(--color-text)]" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          {verses.map((verse, index) => {
            const verseNumber = parseInt(verse.verse_key.split(':')[1], 10);

            return (
              <VerseCardClient
                key={verse.id}
                verse={verse}
                verseNumber={verseNumber}
                verseIndex={index}
                chapterId={chapterId}
                translatorLabel={translatorLabel}
                translationId={parseInt(translationId, 10)}
              />
            );
          })}
        </div>

        <div className="max-w-3xl mx-auto mt-12 text-center border-t border-[var(--color-border)] pt-8">
          <p className="font-arabic text-xl text-[var(--color-accent)] mb-6" dir="rtl">
            {chapter?.name_arabic}
          </p>
          <div className="flex justify-center gap-4 md:gap-8">
            {prevChapter ? (
              <Link
                href={`/quran/${prevChapter}`}
                className="text-[var(--color-primary)] hover:underline text-sm"
              >
                ← Previous Surah
              </Link>
            ) : (
              <span className="text-[var(--color-text-muted)]" />
            )}
            {nextChapter ? (
              <Link
                href={`/quran/${nextChapter}`}
                className="text-[var(--color-primary)] hover:underline text-sm"
              >
                Next Surah →
              </Link>
            ) : (
              <span className="text-[var(--color-text-muted)]" />
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] p-4 md:hidden safe-area-bottom">
        <div className="flex justify-between max-w-3xl mx-auto">
          {prevChapter ? (
            <Link
              href={`/quran/${prevChapter}`}
              className="text-[var(--color-primary)] text-sm flex items-center gap-1"
            >
              ← Prev
            </Link>
          ) : (
            <span />
          )}
          {nextChapter ? (
            <Link
              href={`/quran/${nextChapter}`}
              className="text-[var(--color-primary)] text-sm flex items-center gap-1"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>

      <AudioPlayer />
    </div>
  );
}