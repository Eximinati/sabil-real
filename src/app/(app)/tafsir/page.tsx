import { TafsirSelector } from '@/components/tafsir-selector';
import { SurahSelector } from '@/components/surah-selector';

interface TafsirItem {
  id: number;
  name: string;
  author_name: string | null;
  language_name: string;
}

interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
}

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';

function stripDangerousTags(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
}

export default async function TafsirPage({
  searchParams,
}: {
  searchParams: Promise<{ tafsir?: string; surah?: string }>;
}) {
  const { tafsir, surah } = await searchParams;

  const [tafsirsRes, chaptersRes] = await Promise.all([
    fetch(`${API_BASE}/api/tafsirs`, { cache: 'no-store' }),
    fetch(`${API_BASE}/api/chapters`, { cache: 'no-store' }),
  ]);

  const tafsirsData = await tafsirsRes.json();
  const chaptersData = await chaptersRes.json();

  const tafsirs = (Array.isArray(tafsirsData) ? tafsirsData : []) as TafsirItem[];
  const chapters = (Array.isArray(chaptersData) ? chaptersData : []) as Chapter[];

  interface TafsirVerse {
    id: number;
    verse_key: string;
    text: string;
    resource_name: string;
  }

  let tafsirVerses: TafsirVerse[] = [];
  let selectedTafsir: TafsirItem | undefined;
  let selectedChapter: Chapter | undefined;

  if (tafsir && surah) {
    try {
      const res = await fetch(`${API_BASE}/api/tafsirs/${tafsir}/${surah}`, {
        cache: 'no-store'
      });
      const data = await res.json();
      console.log('Tafsir page received:', JSON.stringify(data).slice(0, 500));
      
      if (data && data.tafsirs) {
        tafsirVerses = data.tafsirs as TafsirVerse[];
      }
      
      selectedTafsir = tafsirs.find((t) => t.id === parseInt(tafsir, 10));
      selectedChapter = chapters.find((c) => c.id === parseInt(surah, 10));
    } catch (e) {
      console.error('Tafsir fetch error:', e);
      tafsirVerses = [];
    }
  }

  return (
    <div className="px-16 pt-12 pb-12">
      <div className="text-center mb-8">
        <h1 className="font-arabic text-[36px] text-[#B7922A]" dir="rtl">التفسير</h1>
        <p className="text-[#6B7280] text-sm mt-2">Quranic Exegesis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <TafsirSelector initialTafsirs={tafsirs} />
        </div>
        <div>
          <SurahSelector chapters={chapters} />
        </div>
      </div>

      {tafsir && surah && selectedTafsir && selectedChapter && (
        <div>
          <div className="text-center mb-8">
            <h2 className="font-arabic text-[28px] text-[#B7922A]" dir="rtl">
              {selectedChapter.name_arabic}
            </h2>
            <p className="text-[#1A1A1A] font-medium mt-2">{selectedChapter.name_simple}</p>
            <p className="text-sm text-[#6B7280] mt-1">{selectedTafsir.author_name || selectedTafsir.name}</p>
          </div>

          {tafsirVerses.length > 0 ? (
            <div className="space-y-4">
              {tafsirVerses.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#E8E0D5] rounded-xl p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-7 h-7 flex items-center justify-center bg-[#B7922A] text-white rounded-full text-xs">
                      {item.verse_key.split(':')[1]}
                    </span>
                    <span className="text-sm text-[#6B7280]">Verse {item.verse_key}</span>
                    <span className="text-xs text-[#6B7280] ml-auto">{item.resource_name}</span>
                  </div>
                  <div
                    className="text-[#1A1A1A] text-[15px] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: stripDangerousTags(item.text || '') }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#6B7280] text-center">No tafsir content available for this selection.</p>
          )}
        </div>
      )}
    </div>
  );
}