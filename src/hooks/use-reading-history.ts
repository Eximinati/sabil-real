'use client';

import { useState, useEffect, useCallback } from 'react';

interface ReadingHistoryItem {
  surahId: number;
  surahName: string;
  surahNameArabic: string;
  lastVerse: number;
  timestamp: number;
}

const STORAGE_KEY = 'sabil-reading-history';
const MAX_HISTORY = 5;

export function useReadingHistory() {
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch (error) {
      console.error('Error reading history from localStorage:', error);
    }
  }, []);

  const addToHistory = useCallback((item: ReadingHistoryItem) => {
    try {
      setHistory(prev => {
        const filtered = prev.filter(h => h.surahId !== item.surahId);
        const updated = [item, ...filtered].slice(0, MAX_HISTORY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }, []);

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, []);

  return {
    history,
    addToHistory,
    clearHistory,
  };
}