import { SurahSearch } from '@/components/surah-search';
import { getApiUrl } from '@/lib/api-url';

export const dynamic = 'force-dynamic';

async function getChaptersFromApi(): Promise<any[]> {
  const res = await fetch(getApiUrl('/chapters'), { cache: 'no-store' });
  const data = await res.json();
  return data.chapters ?? data;
}

export default async function QuranPage() {
  let chapters: any[] = [];

  try {
    chapters = await getChaptersFromApi();
  } catch (e) {
    return (
      <div className="px-6 md:px-[64px] pt-[48px] pb-[48px]">
        <div className="p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-[var(--color-error)] rounded-lg text-center">
          Couldn't load Surah list. Please check your connection and refresh.
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-[64px] pt-[48px] pb-[48px]">
      <div className="text-center mb-10">
        <h1 className="font-arabic text-[36px] text-[var(--color-accent)]" dir="rtl">القرآن الكريم</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-2">The Noble Quran</p>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">114 Surahs · Begin your reading</p>
      </div>

      <SurahSearch chapters={chapters} />
    </div>
  );
}