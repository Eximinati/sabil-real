import { SurahSearch } from '@/components/surah-search';

export const dynamic = 'force-dynamic';

interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  revelation_place: string;
}

const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';

async function getChaptersFromApi(): Promise<Chapter[]> {
  const res = await fetch(`${API_BASE}/api/chapters`, { cache: 'no-store' });
  const data = await res.json();
  return data.chapters ?? data;
}

export default async function QuranPage() {
  let chapters: Chapter[] = [];
  let error: string | null = null;

  try {
    chapters = await getChaptersFromApi();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to fetch chapters';
  }

  if (error) {
    return (
      <div className="px-6 md:px-[64px] pt-[48px] pb-[48px]">
        <div className="p-4 bg-red-50 border border-red-200 text-[#DC2626] rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-[64px] pt-[48px] pb-[48px]">
      <div className="text-center mb-10">
        <h1 className="font-arabic text-[36px] text-[#B7922A]" dir="rtl">القرآن الكريم</h1>
        <p className="text-[#6B7280] text-sm mt-2">The Noble Quran</p>
        <p className="text-[#6B7280] text-sm mt-1">114 Surahs · Begin your reading</p>
      </div>

      <SurahSearch chapters={chapters} />
    </div>
  );
}