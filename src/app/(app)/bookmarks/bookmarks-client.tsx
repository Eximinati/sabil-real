'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useCopy, useI18nText } from '@/hooks/use-copy';
import { hydrateVerses, startPeriodicCleanup } from '@/lib/quran-cache-service';
import { csrfHeader } from '@/lib/csrf-client';

interface EnrichedBookmark {
  id: string;
  surah_id: number;
  verse_number: number;
  created_at: string;
  chapterName: string;
  chapterNameArabic: string;
  verseText: string;
  translationText: string;
}

interface BookmarksClientProps {
  bookmarks: EnrichedBookmark[];
}

export function BookmarksClient({ bookmarks: initialBookmarks }: BookmarksClientProps) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const toast = useToast();
  const copy = useCopy();
  const { interpolate } = useI18nText();

  useEffect(() => {
    const verses = bookmarks.map((b) => ({
      verse_key: `${b.surah_id}:${b.verse_number}`,
      text_uthmani: b.verseText,
      chapterName: b.chapterName,
    }));
    hydrateVerses(verses);
    startPeriodicCleanup();
  }, []);

  const removeBookmark = async (surahId: number, verseNumber: number) => {
    try {
      await fetch('/api/bookmarks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({ surah_id: surahId, verse_number: verseNumber }),
      });
      setBookmarks(prev => prev.filter(
        b => !(b.surah_id === surahId && b.verse_number === verseNumber)
      ));
      toast.info(copy.bookmarks.toastRemoved);
    } catch {
      toast.error(copy.bookmarks.toastError);
    }
  };

  const groupedBookmarks = bookmarks.reduce((acc, bookmark) => {
    const key = bookmark.chapterName;
    if (!acc[key]) {
      acc[key] = {
        nameArabic: bookmark.chapterNameArabic,
        verses: [],
      };
    }
    acc[key].verses.push(bookmark);
    return acc;
  }, {} as Record<string, { nameArabic: string; verses: EnrichedBookmark[] }>);

  if (bookmarks.length === 0) {
    return (
      <div className="px-4 md:px-16 pt-8 md:pt-12 pb-12">
        <div className="text-center mb-10">
          <h1 className="font-arabic text-[36px] text-[var(--color-accent)]" dir="rtl">المفضلة</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-2">{copy.bookmarks.emptySubtitle}</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-20 h-20 mb-6 rounded-full bg-[var(--color-border)]/50 flex items-center justify-center text-[var(--color-text-muted)]">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">
            {copy.bookmarks.emptyTitle}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
            {copy.bookmarks.emptyDescription}
          </p>
          <Link
            href="/quran"
            className="mt-6 px-5 py-2 bg-[var(--color-primary)] text-white rounded-full hover:opacity-90 transition-opacity text-sm font-medium"
          >
            {copy.bookmarks.openQuran}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-16 pt-8 md:pt-12 pb-12">
      <div className="text-center mb-10">
        <h1 className="font-arabic text-[36px] text-[var(--color-accent)]" dir="rtl">المفضلة</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-2">{copy.bookmarks.filledSubtitle}</p>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">
          {interpolate(copy.bookmarks.countLine, {
            count: bookmarks.length,
            plural: bookmarks.length === 1 ? '' : 's',
          })}
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {Object.entries(groupedBookmarks).map(([chapterName, { nameArabic, verses }]) => (
          <div key={chapterName}>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-arabic text-[24px] text-[var(--color-accent)]" dir="rtl">
                {nameArabic}
              </span>
              <span className="text-[var(--color-text-muted)] text-sm">
                {chapterName}
              </span>
            </div>
            <div className="space-y-3">
              {verses.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 md:p-5 hover:border-[var(--color-primary)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 flex items-center justify-center bg-[var(--color-accent)] text-white rounded-full text-xs font-medium">
                          {bookmark.verse_number}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {copy.bookmarks.verseLabel} {bookmark.verse_number}
                        </span>
                      </div>
                      {bookmark.verseText && (
                        <p
                          className="font-arabic text-[18px] text-[var(--color-text)] text-right mb-2 leading-relaxed"
                          dir="rtl"
                        >
                          {bookmark.verseText}
                        </p>
                      )}
                      {bookmark.translationText && (
                        <p className="text-[14px] text-[var(--color-text-secondary)] line-clamp-2">
                          {bookmark.translationText}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Link
                        href={`/quran/${bookmark.surah_id}?verse=${bookmark.verse_number}`}
                        className="px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-xs hover:opacity-90 transition-opacity text-center"
                      >
                        {copy.bookmarks.returnToVerse}
                      </Link>
                      <button
                        onClick={() => removeBookmark(bookmark.surah_id, bookmark.verse_number)}
                        className="px-3 py-1.5 border border-[var(--color-border)] text-[var(--color-text-muted)] rounded-lg text-xs hover:bg-[var(--color-border)]/50 transition-colors"
                      >
                        {copy.bookmarks.remove}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
