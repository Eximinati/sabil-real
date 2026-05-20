'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { useToast } from '@/hooks/use-toast';

interface Bookmark {
  id: string;
  surah_id: number;
  verse_number: number;
  created_at: string;
}

interface UseBookmarksOptions {
  initialBookmarks?: Bookmark[];
  chapterId?: number;
}

export function useBookmarks(options?: UseBookmarksOptions) {
  const { initialBookmarks, chapterId } = options || {};
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks ?? []);
  const [loading, setLoading] = useState(!initialBookmarks);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const hasFetchedRef = useRef(false);
  const toast = useToast();

  const fetchBookmarks = useCallback(async () => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    
    try {
      const res = await fetch('/api/bookmarks');
      const data = await res.json();
      if (data.bookmarks) {
        setBookmarks(data.bookmarks);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialBookmarks && initialBookmarks.length > 0) {
      hasFetchedRef.current = true;
      setBookmarks(initialBookmarks);
      setLoading(false);
      return;
    }
    fetchBookmarks();
  }, [initialBookmarks, fetchBookmarks]);

  const checkBookmark = useCallback((surahId: number, verseNumber: number) => {
    const exists = bookmarks.some(
      b => b.surah_id === surahId && b.verse_number === verseNumber
    );
    setIsBookmarked(exists);
    return exists;
  }, [bookmarks]);

  const toggleBookmark = useCallback(async (surahId: number, verseNumber: number) => {
    const exists = bookmarks.some(
      b => b.surah_id === surahId && b.verse_number === verseNumber
    );

    try {
      if (exists) {
        await fetch('/api/bookmarks', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ surah_id: surahId, verse_number: verseNumber }),
        });
        setBookmarks(prev => prev.filter(
          b => !(b.surah_id === surahId && b.verse_number === verseNumber)
        ));
        toast.info('Bookmark removed');
      } else {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ surah_id: surahId, verse_number: verseNumber }),
        });
        const data = await res.json();
        if (data.bookmark) {
          setBookmarks(prev => [data.bookmark, ...prev]);
          toast.success('Verse bookmarked');
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  }, [bookmarks, toast]);

  return {
    bookmarks,
    loading,
    isBookmarked,
    checkBookmark,
    toggleBookmark,
    refreshBookmarks: fetchBookmarks,
  };
}