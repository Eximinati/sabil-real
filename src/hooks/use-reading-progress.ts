'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ReadingProgress {
  surah_id: number;
  verse_number: number;
  scroll_position: number;
}

const DEBOUNCE_MS = 2000;

export function useReadingProgress(chapterId: number | null) {
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/reading-progress');
      const data = await res.json();
      if (data.progress) {
        setProgress(data.progress);
      }
    } catch (error) {
      console.error('Error fetching reading progress:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchProgress();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchProgress]);

  const updateProgress = useCallback((verseNumber: number, scrollPosition: number = 0) => {
    if (!chapterId || !mountedRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/reading-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            surah_id: chapterId,
            verse_number: verseNumber,
            scroll_position: scrollPosition,
          }),
        });
        setProgress({
          surah_id: chapterId,
          verse_number: verseNumber,
          scroll_position: scrollPosition,
        });
      } catch (error) {
        console.error('Error updating reading progress:', error);
      }
    }, DEBOUNCE_MS);
  }, [chapterId]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getProgressForChapter = useCallback((targetChapterId: number) => {
    if (progress && progress.surah_id === targetChapterId) {
      return progress;
    }
    return null;
  }, [progress]);

  return {
    progress,
    loading,
    updateProgress,
    getProgressForChapter,
  };
}