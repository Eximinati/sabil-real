import { redirect } from 'next/navigation';
import { TranslationSelector } from '@/components/translation-selector';
import { CopyButton } from '@/components/copy-button';
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
    <div className="min-h-screen">
      <div className="sticky top-0 bg-[#F9F6F1] z-10 border-b border-[#E8E0D5] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/quran" className="text-[#2D6A4F] hover:underline">
              ← Back
            </Link>
            <span className="text-[#6B7280]">|</span>
            <span className="text-[#1A1A1A] font-medium">{chapter?.name_simple}</span>
            <span className="font-arabic text-[#B7922A] mr-2" dir="rtl">{chapter?.name_arabic}</span>
          </div>
          <div className="flex items-center gap-4">
            {chapter && (
              <span className="text-sm text-[#6B7280]">{chapter.verses_count} verses</span>
            )}
            <TranslationSelector />
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {error && (
          <div className="max-w-3xl mx-auto p-4 bg-red-50 border border-red-200 text-[#DC2626] rounded-lg mb-6">
            {error}
          </div>
        )}

        {chapter && (
          <div className="text-center mb-8 max-w-3xl mx-auto">
            <span className="font-arabic text-[36px] text-[#B7922A] block" dir="rtl">
              {chapter.name_arabic}
            </span>
            <h1 className="text-[#1A1A1A] text-xl font-medium mt-3">{chapter.name_simple}</h1>
          </div>
        )}

        {showBismillah && (
          <div className="text-center mb-8 max-w-3xl mx-auto">
            <p className="font-arabic text-[24px] text-[#1A1A1A]" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          {verses.map((verse) => {
            const translation = verse.translations?.find((t) => t.resource_id === parseInt(translationId, 10));
            const verseNumber = parseInt(verse.verse_key.split(':')[1], 10);

            return (
              <div
                key={verse.id}
                className="bg-white border border-[#E8E0D5] rounded-xl p-6 mb-4 hover:border-[#2D6A4F] transition-colors relative"
              >
                <CopyButton text={verse.text_uthmani} translation={translation?.text} />
                
                <div className="flex items-start mb-4">
                  <span className="w-7 h-7 flex items-center justify-center bg-[#B7922A] text-white rounded-full text-xs font-medium">
                    {verseNumber}
                  </span>
                </div>
                <p
                  className="font-arabic text-[26px] leading-[2.2] text-[#1A1A1A] text-right mb-4"
                  dir="rtl"
                >
                  {verse.text_uthmani}
                </p>
                <div className="border-t border-[#E8E0D5] pt-4">
                  <p className="text-[#6B7280] text-xs mb-2">{translatorLabel}</p>
                  <p className="text-[#4B5563] text-[15px] leading-[1.8]">
                    {translation?.text || 'Translation unavailable'}
                  </p>
                  <div className="mt-3 text-right">
                    <Link
                      href={`/tafsir?surah=${chapterId}&verse=${verseNumber}`}
                      className="text-xs text-[#2D6A4F] hover:underline"
                    >
                      Tafsir →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="max-w-3xl mx-auto mt-12 text-center border-t border-[#E8E0D5] pt-8">
          <p className="font-arabic text-xl text-[#B7922A] mb-6" dir="rtl">
            {chapter?.name_arabic}
          </p>
          <div className="flex justify-center gap-8">
            {prevChapter ? (
              <Link
                href={`/quran/${prevChapter}`}
                className="text-[#2D6A4F] hover:underline"
              >
                ← Previous Surah
              </Link>
            ) : (
              <span className="text-[#6B7280]" />
            )}
            {nextChapter ? (
              <Link
                href={`/quran/${nextChapter}`}
                className="text-[#2D6A4F] hover:underline"
              >
                Next Surah →
              </Link>
            ) : (
              <span className="text-[#6B7280]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}