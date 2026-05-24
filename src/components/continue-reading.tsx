'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useCopy, useI18nText } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';

interface ReadingPosition {
  surah_id: number;
  verse_number: number;
  scroll_position: number;
  updated_at: string;
}

function formatRelativeTime(
  dateString: string,
  copy: ReturnType<typeof useCopy>,
  interpolate: ReturnType<typeof useI18nText>['interpolate'],
  locale: string
): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return copy.quran.relativeNow;
  if (diffMins < 60) return interpolate(copy.quran.relativeMinutesAgo, { count: diffMins });
  if (diffHours < 24) return interpolate(copy.quran.relativeHoursAgo, { count: diffHours });
  if (diffDays === 1) return copy.quran.relativeYesterday;
  if (diffDays < 7) return interpolate(copy.quran.relativeDaysAgo, { count: diffDays });
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

export function ContinueReading() {
  const [positions, setPositions] = useState<ReadingPosition[]>([]);
  const [chapters, setChapters] = useState<Record<number, { name_simple: string; name_arabic: string }>>({});
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const copy = useCopy();
  const { language } = useLanguage();
  const { interpolate } = useI18nText();
  const locale = language === 'ur' ? 'ur-PK' : 'en-US';

  useEffect(() => {
    Promise.all([
      fetch('/api/reading-progress?limit=5').then(r => r.json()),
      fetch('/api/chapters').then(r => r.json()),
    ])
      .then(([progressData, chaptersData]) => {
        if (progressData.positions && Array.isArray(progressData.positions)) {
          setPositions(progressData.positions.slice(0, 5));
        }
        const chaptersArr = chaptersData.chapters || chaptersData;
        const chaptersMap: Record<number, { name_simple: string; name_arabic: string }> = {};
        chaptersArr.forEach((c: any) => {
          chaptersMap[c.id] = { name_simple: c.name_simple, name_arabic: c.name_arabic };
        });
        setChapters(chaptersMap);
      })
      .catch(() => {
        toast.error(copy.quran.unableLoadHistory);
      })
      .finally(() => setLoading(false));
  }, [copy.quran.unableLoadHistory, toast]);

  const sortedPositions = useMemo(() => {
    return [...positions].sort((a, b) => {
      const dateA = new Date(a.updated_at || 0).getTime();
      const dateB = new Date(b.updated_at || 0).getTime();
      return dateB - dateA;
    });
  }, [positions]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto mb-8">
        <div className="h-12 bg-[var(--color-border)]/30 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (sortedPositions.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="mb-2 text-center text-sm font-medium text-[var(--color-text-muted)]">
        {copy.quran.continueReadingTitle}
      </h3>
      <p className="mb-4 text-center text-sm text-[var(--color-text-muted)]">
        {copy.quran.continueReadingDescription}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide -mx-4 px-4">
        {sortedPositions.map((position) => {
          const chapter = chapters[position.surah_id];
          if (!chapter) return null;

          return (
            <Link
              key={`${position.surah_id}-${position.updated_at}`}
              href={`/quran/${position.surah_id}?verse=${position.verse_number}&scroll=${position.scroll_position}`}
              className="min-w-[150px] max-w-[170px] flex-shrink-0 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all hover:border-[var(--color-primary)]/30"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-arabic text-[18px] text-[var(--color-accent)]" dir="rtl">
                  {chapter.name_arabic}
                </span>
              </div>
              <p className="text-[var(--color-text)] text-sm font-medium truncate">
                {chapter.name_simple}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-muted)]">
                  {copy.quran.verseLabel} {position.verse_number}
                </span>
              </div>
              <p className="text-[var(--color-text-muted)] text-[10px] mt-1">
                {position.updated_at ? formatRelativeTime(position.updated_at, copy, interpolate, locale) : ''}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
