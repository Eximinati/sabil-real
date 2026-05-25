'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCopy } from '@/hooks/use-copy';

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
  const copy = useCopy();
  const currentSurah = searchParams.get('surah');

  const handleSelect = (chapterId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('surah', chapterId);
    router.push(`/tafsir?${params.toString()}`);
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">{copy.tafsir.selectSurah}</h3>
      <div className="max-h-[400px] overflow-y-auto space-y-2 quiet-controls">
        {chapters.map((chapter) => (
          <button
            key={chapter.id}
            onClick={() => handleSelect(chapter.id.toString())}
            className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg border transition-colors ${
              currentSurah === chapter.id.toString()
                ? 'border-[var(--color-primary)] bg-[var(--color-bg)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center border border-[var(--color-border)] rounded-full text-xs text-[var(--color-text-muted)]">
              {chapter.id}
            </span>
            <span className="font-arabic text-[16px] text-[var(--color-text)]" dir="rtl">
              {chapter.name_arabic}
            </span>
            <span className="text-sm text-[var(--color-text-muted)] ml-auto">{chapter.name_simple}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
