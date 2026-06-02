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
const STORAGE_KEY = 'quran-reading-progress';

function saveProgressCache(data: { progress: ReadingPosition | null; positions: ReadingPosition[] }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded */ }
}

function loadProgressCache(): { progress: ReadingPosition | null; positions: ReadingPosition[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useReadingProgress(chapterId: number | null): UseReadingProgressResult {
  const [progress, setProgress] = useState<ReadingPosition | null>(null);
  const [positions, setPositions] = useState<ReadingPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);
  const pendingRef = useRef<{
    verseNumber: number;
    scrollPosition: number;
  } | null>(null);

  const doFetch = useCallback(async (verseNumber: number, scrollPosition: number) => {
    if (!chapterId) return;
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
        saveProgressCache({ progress: data.progress || null, positions: data.positions });
      }
    } catch (error) {
      console.error('Error updating reading progress:', error);
      const fallback: ReadingPosition = {
        surah_id: chapterId,
        verse_number: verseNumber,
        scroll_position: scrollPosition,
        updated_at: new Date().toISOString(),
      };
      setProgress(fallback);
      setPositions(prev => {
        const filtered = prev.filter(p => p.surah_id !== chapterId);
        const updated = [fallback, ...filtered];
        saveProgressCache({ progress: fallback, positions: updated });
        return updated;
      });
    }
  }, [chapterId]);

  const pushPosition = useCallback(async (surahId: number, verseNumber: number, scrollPosition: number) => {
    try {
      const res = await fetch('/api/reading-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({
          surah_id: surahId,
          verse_number: verseNumber,
          scroll_position: scrollPosition,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.positions) {
        setPositions(data.positions);
        saveProgressCache({ progress: data.progress || null, positions: data.positions });
      }
    } catch {
      /* local cache preserves data — retry on next reconcile */
    }
  }, []);

  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch('/api/reading-progress?limit=10');
      const data = await res.json();

      if (data.progress) setProgress(data.progress);
      if (data.positions) setPositions(data.positions);

      const localCache = loadProgressCache();
      if (localCache && localCache.positions.length > 0 && data.positions) {
        const stale = localCache.positions.filter(local => {
          const server = data.positions.find(
            (s: ReadingPosition) => s.surah_id === local.surah_id
          );
          return !server || new Date(local.updated_at) > new Date(server.updated_at);
        });

        if (stale.length > 0) {
          await Promise.allSettled(
            stale.map(pos => pushPosition(pos.surah_id, pos.verse_number, pos.scroll_position))
          );
        }
      }
    } catch (error) {
      console.error('Error fetching reading progress:', error);
      const local = loadProgressCache();
      if (local) {
        if (local.progress) setProgress(local.progress);
        if (local.positions.length > 0) setPositions(local.positions);
      }
    } finally {
      setLoading(false);
    }
  }, [pushPosition]);

  useEffect(() => {
    mountedRef.current = true;
    fetchPositions();
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (pendingRef.current && chapterId) {
        doFetch(pendingRef.current.verseNumber, pendingRef.current.scrollPosition);
      }
    };
  }, [fetchPositions, chapterId, doFetch]);

  const updateProgress = useCallback((verseNumber: number, scrollPosition: number = 0) => {
    if (!chapterId || !mountedRef.current) return;

    pendingRef.current = { verseNumber, scrollPosition };

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      pendingRef.current = null;
      await doFetch(verseNumber, scrollPosition);
    }, DEBOUNCE_MS);
  }, [chapterId, doFetch]);

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