'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
}

interface HadithBody {
  lang: string;
  chapterTitle: string;
  body: string;
  grades: Array<{ graded_by: string; grade: string }>;
}

interface Hadith {
  urn: number;
  collection: string;
  bookNumber: string;
  hadithNumber: string;
  name: string;
  hadith: HadithBody[];
}

interface HadithsResponse {
  hadiths: Hadith[];
  page: number;
  limit: number;
  has_more: boolean;
}

function stripDangerousTags(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
}

export function HadithPageContent({
  chapters,
  initialSurah,
  initialVerse,
}: {
  chapters: Chapter[];
  initialSurah?: string;
  initialVerse?: string;
}) {
  const searchParams = useSearchParams();
  const surah = searchParams.get('surah') || initialSurah || '1';
  const verse = searchParams.get('verse') || initialVerse || '1';
  const [hadithData, setHadithData] = useState<HadithsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasAccessError, setHasAccessError] = useState(false);

  const selectedChapter = chapters.find((c) => c.id === parseInt(surah, 10));

  const fetchHadiths = async () => {
    setLoading(true);
    setHasAccessError(false);
    try {
      const res = await fetch(`/api/hadith/${surah}:${verse}`, { cache: 'no-store' });
      const data = await res.json();
      console.log('Hadith page received:', JSON.stringify(data).slice(0, 500));
      setHadithData(data);
    } catch (e) {
      console.error('Hadith fetch error:', e);
      setHasAccessError(true);
    }
    setLoading(false);
  };

  return (
    <div className="px-16 pt-12 pb-12">
      <div className="text-center mb-8">
        <h1 className="font-arabic text-[36px] text-[#B7922A]" dir="rtl">الحديث</h1>
        <p className="text-[#6B7280] text-sm mt-2">Hadith References by Verse</p>
        <p className="text-sm text-[#6B7280] max-w-xl mx-auto mt-4">
          Explore hadith narrations connected to specific Quranic verses. 
          Select a surah and verse to find related hadith references.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end justify-center mb-8">
        <div>
          <label className="block text-sm text-[#6B7280] mb-1">Surah</label>
          <select
            value={surah}
            onChange={(e) => {
              window.location.href = `/hadith?surah=${e.target.value}&verse=1`;
            }}
            className="border border-[#E8E0D5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2D6A4F] min-w-[200px]"
          >
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.id}. {chapter.name_simple}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-[#6B7280] mb-1">Verse</label>
          <input
            type="number"
            value={verse}
            onChange={(e) => {
              window.location.href = `/hadith?surah=${surah}&verse=${e.target.value}`;
            }}
            min={1}
            max={selectedChapter?.verses_count || 1}
            className="border border-[#E8E0D5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2D6A4F] w-24"
          />
        </div>

        <button
          onClick={fetchHadiths}
          disabled={loading}
          className="bg-[#2D6A4F] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#1B4332] transition-colors disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Find Hadith'}
        </button>
      </div>

      {surah && verse && (
        <div className="max-w-3xl mx-auto">
          <h2 className="text-lg font-medium text-[#1A1A1A] text-center mb-6">
            Hadith references for {selectedChapter?.name_simple} {surah}:{verse}
          </h2>

          {!hadithData && !loading && !hasAccessError && (
            <p className="text-[#6B7280] text-center">Click "Find Hadith" to search for hadith references.</p>
          )}

          {hasAccessError ? (
            <div className="bg-white border border-[#E8E0D5] rounded-xl p-6 text-center">
              <p className="text-[#6B7280]">
                Hadith references require extended API access. 
                This feature will be available soon.
              </p>
            </div>
          ) : hadithData && hadithData.hadiths.length === 0 ? (
            <p className="text-[#6B7280] text-center">No hadith references found for this verse</p>
          ) : hadithData && hadithData.hadiths.length > 0 && (
            <div className="space-y-4">
              {hadithData.hadiths.map((hadith) => (
                <div
                  key={hadith.urn}
                  className="bg-white border border-[#E8E0D5] rounded-xl p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-[#2D6A4F]">{hadith.name}</span>
                    <span className="px-2 py-1 bg-[#B7922A] text-white rounded-full text-xs">
                      #{hadith.hadithNumber}
                    </span>
                  </div>
                  {hadith.hadith[0]?.chapterTitle && (
                    <p className="text-sm text-[#6B7280] mb-2">{hadith.hadith[0].chapterTitle}</p>
                  )}
                  {hadith.hadith[0]?.body && (
                    <div
                      className="text-[#1A1A1A] text-[15px] leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: stripDangerousTags(hadith.hadith[0].body) }}
                    />
                  )}
                  {hadith.hadith[0]?.grades && hadith.hadith[0].grades.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {hadith.hadith[0].grades.map((g, i) => (
                        <span key={i} className="text-xs text-[#6B7280] bg-[#F0F9F4] px-2 py-1 rounded">
                          {g.graded_by}: {g.grade}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {hadithData.has_more && (
                <button
                  onClick={fetchHadiths}
                  className="w-full py-3 text-[#2D6A4F] border border-[#2D6A4F] rounded-lg hover:bg-[#F0F9F4] transition-colors"
                >
                  Load more
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}