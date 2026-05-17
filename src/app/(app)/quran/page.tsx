import { getChapters } from '@/lib/qf-api';

export const dynamic = 'force-dynamic';

interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  revelation_place: string;
}

export default async function QuranPage() {
  let chapters: Chapter[] = [];
  let error: string | null = null;

  try {
    chapters = await getChapters();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to fetch chapters';
  }

  return (
    <div className="px-6 md:px-[64px] pt-[48px] pb-[48px]">
      <div className="text-center mb-10">
        <h1 className="font-arabic text-[36px] text-[#B7922A]" dir="rtl">القرآن الكريم</h1>
        <p className="text-[#6B7280] text-sm mt-2">The Noble Quran</p>
        <p className="text-[#6B7280] text-sm mt-1">114 Surahs · Begin your reading</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-[#DC2626] rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chapters.map((chapter) => (
          <a
            key={chapter.id}
            href={`/quran/${chapter.id}`}
            className="block bg-white border border-[#E8E0D5] rounded-xl p-5 shadow-sm hover:border-[#2D6A4F] transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="w-8 h-8 flex items-center justify-center border border-[#E8E0D5] rounded-full text-[#6B7280] text-sm font-mono">
                {chapter.id}
              </span>
              <div className="flex-1">
                <span className="font-arabic text-[20px] text-[#1A1A1A]" dir="rtl">
                  {chapter.name_arabic}
                </span>
                <p className="text-[#6B7280] text-sm">{chapter.name_simple}</p>
              </div>
              <div className="text-right">
                <p className="text-[#6B7280] text-xs">{chapter.verses_count} verses</p>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                    chapter.revelation_place === 'Meccan'
                      ? 'bg-[#F0F9F4] text-[#2D6A4F]'
                      : 'bg-[#FFF8ED] text-[#B7922A]'
                  }`}
                >
                  {chapter.revelation_place === 'Meccan' ? 'Makkah' : 'Madinah'}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}