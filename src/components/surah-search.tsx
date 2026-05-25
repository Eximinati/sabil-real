'use client';

import { useState } from 'react';
import { useCopy, useI18nText } from '@/hooks/use-copy';

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
  const copy = useCopy();
  const { interpolate } = useI18nText();

  const filtered = chapters.filter(
    (c) =>
      c.name_simple.toLowerCase().includes(search.toLowerCase()) ||
      c.name_arabic.includes(search)
  );

  const total = chapters.length;
  const showing = filtered.length;

  return (
    <div className="max-w-md mx-auto mb-8 reading-section">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={copy.quran.searchPlaceholder}
        className="w-full px-4 py-3 md:py-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
      />
      <p className="text-center text-[var(--color-text-muted)] text-sm mt-3">
        {interpolate(copy.quran.showingSurahs, { showing, total })}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mt-6">
        {filtered.map((chapter) => (
          <a
            key={chapter.id}
            href={`/quran/${chapter.id}`}
            className="block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 md:p-5 shadow-sm hover:border-[var(--color-primary)] transition-colors card-hover"
          >
            <div className="flex items-center gap-3 md:gap-4">
              <span className="w-9 h-9 md:w-[36px] md:h-[36px] flex items-center justify-center border border-[var(--color-border)] rounded-full text-[var(--color-text-muted)] text-sm font-mono flex-shrink-0">
                {chapter.id}
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-arabic text-[20px] md:text-[22px] text-[var(--color-text)]" dir="rtl">
                  {chapter.name_arabic}
                </span>
                <p className="text-[var(--color-text-muted)] text-sm truncate">{chapter.name_simple}</p>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs ${
                    chapter.revelation_place === 'Meccan'
                      ? 'bg-[var(--color-bg)] text-[var(--color-primary)]'
                      : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
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
