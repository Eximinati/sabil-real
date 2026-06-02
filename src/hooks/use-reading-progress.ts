'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { csrfHeader } from '@/lib/csrf-client';

interface ReadingPosition {
  surah_id: number;
  verse_number: number;
  scroll_position: number;
  updated_at: string;
}

interface UseReadingProgressResult {
  progress: ReadingPosition | null;
  positions: ReadingPosition[];
  loading: boolean;
  updateProgress: (verseNumber: number, scrollPosition?: number) => void;
  getPositionForSurah: (surahId: number) => ReadingPosition | null;
  getAllPositions: () => ReadingPosition[];
  clearPosition: (surahId: number) => Promise<void>;
}

const DEBOUNCE_MS = 2000;

export function useReadingProgress(chapterId: number | null): UseReadingProgressResult {
  const [progress, setProgress] = useState<ReadingPosition | null>(null);
  const [positions, setPositions] = useState<ReadingPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);

  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch('/api/reading-progress?limit=10');
      const data = await res.json();
      if (data.progress) {
        setProgress(data.progress);
      }
      if (data.positions && Array.isArray(data.positions)) {
        setPositions(data.positions);
      }
    } catch (error) {
      console.error('Error fetching reading progress:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchPositions();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchPositions]);

  const updateProgress = useCallback((verseNumber: number, scrollPosition: number = 0) => {
    if (!chapterId || !mountedRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/reading-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...csrfHeader() },
          body: JSON.stringify({
            surah_id: chapterId,
            verse_number: verseNumber,
            scroll_position: scrollPosition,
          }),
        });
        const data = await res.json();
        
        if (data.progress) {
          setProgress(data.progress);
        }
        
        if (data.positions && Array.isArray(data.positions)) {
          setPositions(data.positions);
        }
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

  const getPositionForSurah = useCallback((targetSurahId: number): ReadingPosition | null => {
    return positions.find(p => p.surah_id === targetSurahId) || null;
  }, [positions]);

  const getAllPositions = useCallback((): ReadingPosition[] => {
    return positions;
  }, [positions]);

  const clearPosition = useCallback(async (surahId: number) => {
    if (!mountedRef.current) return;
    try {
      await fetch(`/api/reading-progress?surah_id=${surahId}`, {
        method: 'DELETE',
        headers: { ...csrfHeader() },
      });
      setPositions(prev => prev.filter(p => p.surah_id !== surahId));
      if (progress?.surah_id === surahId) {
        const remaining = positions.filter(p => p.surah_id !== surahId);
        setProgress(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (error) {
      console.error('Error clearing position:', error);
    }
  }, [progress, positions]);

  return {
    progress,
    positions,
    loading,
    updateProgress,
    getPositionForSurah,
    getAllPositions,
    clearPosition,
  };
}