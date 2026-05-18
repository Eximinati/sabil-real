'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { useToast } from '@/hooks/use-toast';

interface Bookmark {
  id: string;
  surah_id: number;
  verse_number: number;
  created_at: string;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const toast = useToast();

  const fetchBookmarks = useCallback(async () => {
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
    fetchBookmarks();
  }, [fetchBookmarks]);

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