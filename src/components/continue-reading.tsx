'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ReadingProgress {
  surah_id: number;
  verse_number: number;
  scroll_position: number;
}

interface ReadingHistoryItem {
  surahId: number;
  surahName: string;
  surahNameArabic: string;
  lastVerse: number;
  timestamp: number;
}

export function ContinueReading() {
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [chapters, setChapters] = useState<Record<number, { name_simple: string; name_arabic: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/reading-progress').then(r => r.json()),
      fetch('/api/chapters').then(r => r.json()),
    ])
      .then(([progressData, chaptersData]) => {
        if (progressData.progress) {
          setProgress(progressData.progress);
        }
        const chaptersArr = chaptersData.chapters || chaptersData;
        const chaptersMap: Record<number, { name_simple: string; name_arabic: string }> = {};
        chaptersArr.forEach((c: any) => {
          chaptersMap[c.id] = { name_simple: c.name_simple, name_arabic: c.name_arabic };
        });
        setChapters(chaptersMap);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    try {
      const stored = localStorage.getItem('sabil-reading-history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {}
  }, []);

  if (loading) {
    return (
      <div className="max-w-md mx-auto mb-10">
        <div className="h-32 bg-[var(--color-border)]/30 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (progress && chapters[progress.surah_id]) {
    const chapter = chapters[progress.surah_id];
    return (
      <div className="max-w-md mx-auto mb-10">
        <Link
          href={`/quran/${progress.surah_id}?verse=${progress.verse_number}`}
          className="block bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-2xl p-6 hover:border-[var(--color-primary)]/40 transition-all group"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-[var(--color-primary)] text-white text-xs rounded-full">
              Continue Reading
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-arabic text-[24px] text-[var(--color-accent)] block mb-1" dir="rtl">
                {chapter.name_arabic}
              </span>
              <p className="text-[var(--color-text)] font-medium">{chapter.name_simple}</p>
              <p className="text-[var(--color-text-muted)] text-sm">
                Verse {progress.verse_number}
              </p>
            </div>
            <span className="w-12 h-12 flex items-center justify-center bg-[var(--color-primary)] text-white rounded-full group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </div>
        </Link>
      </div>
    );
  }

  if (history.length > 0) {
    return (
      <div className="mb-8">
        <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-4 text-center">
          Recently Read
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide">
          {history.slice(0, 5).map((item) => (
            <Link
              key={item.surahId}
              href={`/quran/${item.surahId}`}
              className="flex-shrink-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-primary)] transition-colors min-w-[140px]"
            >
              <span className="font-arabic text-[18px] text-[var(--color-accent)] block mb-1" dir="rtl">
                {item.surahNameArabic || `سورة ${item.surahId}`}
              </span>
              <p className="text-[var(--color-text)] text-sm truncate">{item.surahName}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return null;
}