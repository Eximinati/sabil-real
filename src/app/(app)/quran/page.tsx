import { SurahSearch } from '@/components/surah-search';
import { ContinueReading } from '@/components/continue-reading';
import { getApiUrl } from '@/lib/api-url';
import { getServerDictionary } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

async function getChaptersFromApi(): Promise<any[]> {
  const res = await fetch(getApiUrl('/chapters'), { cache: 'no-store' });
  const data = await res.json();
  return data.chapters ?? data;
}

export default async function QuranPage() {
  const { dictionary: copy } = await getServerDictionary();
  let chapters: any[] = [];

  try {
    chapters = await getChaptersFromApi();
  } catch (e) {
    return (
      <div className="px-6 md:px-[64px] pt-[48px] pb-[48px]">
        <div className="p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-[var(--color-error)] rounded-lg text-center">
          {copy.quran.loadErrorTitle}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-[64px] pt-[48px] pb-[48px]">
      <div className="text-center mb-10">
        <h1 className="font-arabic text-[36px] text-[var(--color-accent)]" dir="rtl">القرآن الكريم</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-2">{copy.quran.pageSubtitle}</p>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">{copy.quran.pageDescription}</p>
      </div>

      <ContinueReading />

      <SurahSearch chapters={chapters} />
    </div>
  );
}
