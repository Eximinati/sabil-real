import { TafsirSelector } from '@/components/tafsir-selector';
import { SurahSelector } from '@/components/surah-selector';
import { getCachedChapters, getCachedTafsirs, getCachedTafsirContent } from '@/lib/api-utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { getServerDictionary } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TafsirPage({
  searchParams,
}: {
  searchParams: Promise<{ tafsir?: string; surah?: string }>;
}) {
  const { dictionary: copy, language } = await getServerDictionary();
  const isUrdu = language === 'ur';

  const pageCopy = isUrdu
    ? {
        sourceTitle: 'علمی ماخذ کی تفسیر',
        sourceDescription: 'یہ متن منتخب تفسیر سے بطور ماخذ پیش کیا جا رہا ہے، Sabil کے درسی رہنمائی متن سے الگ۔',
      }
    : {
        sourceTitle: 'Scholarly source tafsir',
        sourceDescription: 'These entries are source commentary from your selected tafsir, presented separately from Sabil lesson guidance.',
      };
  const { tafsir, surah } = await searchParams;

  const [tafsirs, chapters] = await Promise.all([
    getCachedTafsirs(),
    getCachedChapters(),
  ]);

  let tafsirVerses: any[] = [];
  let selectedTafsir: any;
  let selectedChapter: any;
  let invalidSurah = false;

  if (tafsir && surah) {
    const surahNum = parseInt(surah, 10);
    if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
      invalidSurah = true;
    } else {
      try {
        const data = await getCachedTafsirContent(parseInt(tafsir, 10), surahNum) as unknown as { tafsirs?: any[] };
        
        if (data && data.tafsirs) {
          tafsirVerses = data.tafsirs;
        }
        
        selectedTafsir = tafsirs.find((t) => t.id === parseInt(tafsir, 10));
        selectedChapter = chapters.find((c) => c.id === surahNum);
      } catch (e) {
        tafsirVerses = [];
      }
    }
  }

  return (
    <div className="reading-screen px-4 md:px-16 pt-7 md:pt-12 pb-20 md:pb-12">
      <div className="text-center mb-8 reading-section">
        <h1 className="font-arabic text-[36px] text-[var(--color-accent)]" dir="rtl">التفسير</h1>
        <p className={`text-[var(--color-text-muted)] mt-2 ${isUrdu ? 'font-urdu text-[16px] leading-[2.05]' : 'text-sm leading-[1.8]'}`}>
          {copy.tafsir.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6 md:gap-8 mb-8 max-w-4xl mx-auto reading-section">
        <div>
          <TafsirSelector initialTafsirs={tafsirs} />
        </div>
        <div>
          <SurahSelector chapters={chapters} />
        </div>
      </div>

      {tafsir && surah && invalidSurah && (
        <div className="max-w-4xl mx-auto text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--color-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-2">{copy.tafsir.invalidSurahTitle}</h2>
          <p className="text-[var(--color-text-muted)] text-sm mb-6">{copy.tafsir.invalidSurahDescription}</p>
          <a href="/tafsir" className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-full hover:opacity-90 transition-opacity text-sm font-medium">
            {copy.tafsir.selectValidSurah}
          </a>
        </div>
      )}

      {tafsir && surah && !invalidSurah && selectedTafsir && selectedChapter && (
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-arabic text-[26px] md:text-[28px] text-[var(--color-accent)]" dir="rtl">
              {selectedChapter.name_arabic}
            </h2>
            <p className="text-[var(--color-text)] font-medium mt-2">{selectedChapter.name_simple}</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{selectedTafsir.author_name || selectedTafsir.name}</p>
          </div>

          <div className="mb-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/75 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-primary)]">{pageCopy.sourceTitle}</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {pageCopy.sourceDescription}
            </p>
          </div>

          {tafsirVerses.length > 0 ? (
            <div className="space-y-4">
              {tafsirVerses.map((item) => (
                <div
                  key={item.id}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 md:p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-7 h-7 flex items-center justify-center bg-[var(--color-accent)] text-white rounded-full text-xs">
                      {item.verse_key.split(':')[1]}
                    </span>
                    <span className="text-sm text-[var(--color-text-muted)]">{copy.tafsir.verseLabel} {item.verse_key}</span>
                    <span className="text-xs text-[var(--color-text-muted)] ml-auto">{item.resource_name}</span>
                  </div>
                  <div
                    className="reading-arabic text-[var(--color-text)] text-[16px] md:text-[18px] font-arabic"
                    dir="rtl"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.text || '') }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-[var(--color-border)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-[var(--color-text-muted)]">{copy.tafsir.noTafsirTitle}</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-2">{copy.tafsir.noTafsirDescription}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
