'use client';

import { useState } from 'react';

interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  revelation_place: string;
}

interface SurahSearchProps {
  chapters: Chapter[];
}

export function SurahSearch({ chapters }: SurahSearchProps) {
  const [search, setSearch] = useState('');

  const filtered = chapters.filter(
    (c) =>
      c.name_simple.toLowerCase().includes(search.toLowerCase()) ||
      c.name_arabic.includes(search)
  );

  const total = chapters.length;
  const showing = filtered.length;

  return (
    <div className="max-w-md mx-auto mb-8">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search surahs..."
        className="w-full px-4 py-3 border border-[#E8E0D5] rounded-lg focus:outline-none focus:border-[#2D6A4F] transition-colors"
      />
      <p className="text-center text-[#6B7280] text-sm mt-3">
        Showing {showing} of {total} Surahs
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {filtered.map((chapter) => (
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
                  {chapter.revelation_place === 'Meccan' ? 'Makkah' : chapter.revelation_place === 'Medinan' ? 'Madinah' : chapter.revelation_place}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}