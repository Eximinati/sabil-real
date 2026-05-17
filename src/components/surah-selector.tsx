'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
}

interface SurahSelectorProps {
  chapters: Chapter[];
}

export function SurahSelector({ chapters }: SurahSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSurah = searchParams.get('surah');

  const handleSelect = (chapterId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('surah', chapterId);
    router.push(`/tafsir?${params.toString()}`);
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-[#6B7280] mb-3">Select Surah</h3>
      <div className="max-h-[400px] overflow-y-auto space-y-2">
        {chapters.map((chapter) => (
          <button
            key={chapter.id}
            onClick={() => handleSelect(chapter.id.toString())}
            className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg border transition-colors ${
              currentSurah === chapter.id.toString()
                ? 'border-[#2D6A4F] bg-[#F0F9F4]'
                : 'border-[#E8E0D5] hover:border-[#2D6A4F]'
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center border border-[#E8E0D5] rounded-full text-xs text-[#6B7280]">
              {chapter.id}
            </span>
            <span className="font-arabic text-[16px] text-[#1A1A1A]" dir="rtl">
              {chapter.name_arabic}
            </span>
            <span className="text-sm text-[#6B7280] ml-auto">{chapter.name_simple}</span>
          </button>
        ))}
      </div>
    </div>
  );
}