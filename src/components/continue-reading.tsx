'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface ReadingPosition {
  surah_id: number;
  verse_number: number;
  scroll_position: number;
  updated_at: string;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getProgressHint(totalVerses: number, currentVerse: number): string {
  const progress = Math.round((currentVerse / totalVerses) * 100);
  if (progress < 25) return 'Beginning';
  if (progress < 50) return 'Quarter way';
  if (progress < 75) return 'Halfway';
  if (progress < 90) return 'Near end';
  return 'Finishing';
}

const SURAH_VERSE_COUNTS: Record<number, number> = {
  1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129,
  10: 109, 11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111,
  18: 110, 19: 98, 20: 135, 21: 112, 22: 78, 23: 118, 24: 64, 25: 77,
  26: 227, 27: 93, 28: 88, 29: 69, 30: 60, 31: 34, 32: 30, 33: 73,
  34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85, 41: 54,
  42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18,
  50: 45, 51: 60, 52: 56, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29,
  58: 22, 59: 24, 60: 13, 61: 14, 62: 11, 63: 11, 64: 18, 65: 12,
  66: 12, 67: 30, 68: 52, 69: 52, 70: 44, 71: 28, 72: 28, 73: 20,
  74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42, 81: 29,
  82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30,
  90: 20, 91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5,
  98: 8, 99: 8, 100: 11, 101: 11, 102: 8, 103: 3, 104: 9, 105: 5,
  106: 4, 107: 7, 108: 3, 109: 6, 110: 3, 111: 5, 112: 4, 113: 5,
  114: 6
};

export function ContinueReading() {
  const [positions, setPositions] = useState<ReadingPosition[]>([]);
  const [chapters, setChapters] = useState<Record<number, { name_simple: string; name_arabic: string }>>({});
  const [loading, setLoading] = useState(true);
  const toast = useToast();

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
        toast.error('Unable to load reading history');
      })
      .finally(() => setLoading(false));
  }, [toast]);

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
      <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-4 text-center">
        Continue Reading
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide -mx-4 px-4">
        {sortedPositions.map((position) => {
          const chapter = chapters[position.surah_id];
          if (!chapter) return null;
          
          const totalVerses = SURAH_VERSE_COUNTS[position.surah_id] || 1;
          const progressHint = getProgressHint(totalVerses, position.verse_number);
          
          return (
            <Link
              key={`${position.surah_id}-${position.updated_at}`}
              href={`/quran/${position.surah_id}?verse=${position.verse_number}&scroll=${position.scroll_position}`}
              className="flex-shrink-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-2xl p-4 hover:border-[var(--color-primary)]/40 transition-all min-w-[140px] max-w-[160px]"
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
                  {position.verse_number}
                </span>
                <span className="text-[var(--color-primary)]/70 text-[10px]">
                  {progressHint}
                </span>
              </div>
              <p className="text-[var(--color-text-muted)] text-[10px] mt-1">
                {position.updated_at ? formatRelativeTime(position.updated_at) : ''}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}