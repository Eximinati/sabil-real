import { getChapter, getVerses } from '@/lib/qf-api';

interface PageProps {
  params: Promise<{ id: string }>;
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

export default async function ChapterPage({ params }: PageProps) {
  const { id } = await params;
  const chapterId = parseInt(id, 10);

  let chapter: ChapterData | null = null;
  let verses: Verse[] = [];
  let error: string | null = null;

  try {
    const [chapterData, versesData] = await Promise.all([
      getChapter(chapterId),
      getVerses(chapterId, { translations: '131' }),
    ]);
    chapter = chapterData;
    verses = versesData.verses;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to fetch chapter';
  }

  const showBismillah = chapterId !== 1 && chapterId !== 9;

  return (
    <div className="px-[64px] pt-[32px] pb-[48px]">
      <div className="flex items-center gap-4 mb-8">
        <a
          href="/quran"
          className="text-[#2D6A4F] hover:underline"
        >
          ← Back
        </a>
        {chapter && (
          <>
            <span className="text-[#6B7280]">|</span>
            <span className="text-[#1A1A1A] font-medium">{chapter.name_simple}</span>
          </>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-[#DC2626] rounded-lg">
          {error}
        </div>
      )}

      {chapter && (
        <div className="text-center mb-10">
          <span className="font-arabic text-[36px] text-[#B7922A] block" dir="rtl">
            {chapter.name_arabic}
          </span>
          <h1 className="text-[#1A1A1A] text-xl font-medium mt-3">{chapter.name_simple}</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            {chapter.verses_count} verses · {chapter.revelation_place === 'Meccan' ? 'Makkah' : 'Madinah'}
          </p>
        </div>
      )}

      {showBismillah && (
        <div className="text-center mb-8">
          <p className="font-arabic text-[24px] text-[#1A1A1A]" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {verses.map((verse) => {
          const translation = verse.translations?.find((t) => t.resource_id === 131);
          const verseNumber = parseInt(verse.verse_key.split(':')[1], 10);

          return (
            <div
              key={verse.id}
              className="bg-white border border-[#E8E0D5] rounded-xl p-6 mb-4"
            >
              <div className="flex items-start mb-4">
                <span className="w-7 h-7 flex items-center justify-center border border-[#E8E0D5] rounded-full text-[#6B7280] text-xs">
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
                <p className="text-[#6B7280] text-xs mb-2">Sahih International</p>
                <p className="text-[#4B5563] text-[15px] leading-[1.8]">
                  {translation?.text || 'Translation unavailable'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}