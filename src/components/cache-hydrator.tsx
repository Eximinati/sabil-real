'use client';

import { useEffect } from 'react';
import { hydrateVerses, startPeriodicCleanup } from '@/lib/quran-cache-service';

interface CacheHydratorProps {
  verses: Array<{
    verse_key: string;
    text_uthmani: string;
    chapterName?: string;
  }>;
}

export function CacheHydrator({ verses }: CacheHydratorProps) {
  useEffect(() => {
    if (verses.length > 0) {
      hydrateVerses(verses);
    }
    startPeriodicCleanup();
  }, []);
  return null;
}
