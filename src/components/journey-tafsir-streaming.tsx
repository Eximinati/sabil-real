'use client';

import { useState, useEffect } from 'react';

interface TafsirData {
  text: string;
  verse_number: number;
  resource_name?: string;
}

interface JourneyTafsirStreamingProps {
  verseKeys: string[];
  tafsirId: number;
}

export function JourneyTafsirStreaming({ verseKeys, tafsirId }: JourneyTafsirStreamingProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tafsirs, setTafsirs] = useState<TafsirData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTriedLoading, setHasTriedLoading] = useState(false);

  useEffect(() => {
    if (!isExpanded || hasTriedLoading) return;

    const verseNumbers = verseKeys.map(vk => vk.split(':')[1]).filter(Boolean);
    const chapterId = verseKeys[0]?.split(':')[0];
    
    if (!chapterId || verseNumbers.length === 0) {
      setHasTriedLoading(true);
      return;
    }

    async function fetchTafsirs() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          verses: verseNumbers.join(',')
        });
        
        const res = await fetch(`/api/tafsirs/${tafsirId}/${chapterId}?${params}`);
        
        if (!res.ok) throw new Error('Failed to fetch tafsir');
        
        const data = await res.json();
        const fetchedTafsirs = data.tafsirs || data || [];
        
        const filtered = Array.isArray(fetchedTafsirs) 
          ? fetchedTafsirs.filter((t: TafsirData) => verseNumbers.includes(String(t.verse_number)))
          : [];
        
        setTafsirs(filtered);
        setHasTriedLoading(true);
      } catch (err) {
        setError('Failed to load tafsir');
        setHasTriedLoading(true);
      } finally {
        setLoading(false);
      }
    }

    fetchTafsirs();
  }, [isExpanded, tafsirId, verseKeys, hasTriedLoading]);

  if (!isExpanded) {
    return (
      <div className="mb-8">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center justify-between w-full p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-primary)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="font-medium text-[var(--color-text)]">Tafsir</span>
          </div>
          <svg 
            className="w-5 h-5 text-[var(--color-text-muted)]" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mb-8 animate-pulse">
        <div className="flex items-center justify-between w-full p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-[var(--color-border)] rounded" />
            <div className="w-16 h-5 bg-[var(--color-border)] rounded" />
          </div>
          <div className="w-5 h-5 bg-[var(--color-border)] rounded" />
        </div>
        <div className="mt-3 space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-4">
              <div className="h-4 bg-[var(--color-border)] rounded w-1/4 mb-2" />
              <div className="h-4 bg-[var(--color-border)] rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || tafsirs.length === 0) {
    return (
      <div className="mb-8">
        <button
          onClick={() => setIsExpanded(false)}
          className="flex items-center justify-between w-full p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="font-medium text-[var(--color-text)]">Tafsir</span>
          </div>
          <svg 
            className="w-5 h-5 text-[var(--color-text-muted)] rotate-180" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="mt-3 p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg">
          <p className="text-sm text-[var(--color-text-muted)]">No tafsir available for these verses</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsExpanded(false)}
        className="flex items-center justify-between w-full p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="font-medium text-[var(--color-text)]">Tafsir</span>
        </div>
        <svg 
          className="w-5 h-5 text-[var(--color-text-muted)] rotate-180" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="mt-3 space-y-4">
        {tafsirs.slice(0, 3).map((tafsir, idx) => (
          <div key={idx} className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-4">
            <div className="text-xs text-[var(--color-primary)] mb-2">
              Verse {tafsir.verse_number}
              {tafsir.resource_name && (
                <span className="text-[var(--color-text-muted)] ml-2">
                  — {tafsir.resource_name}
                </span>
              )}
            </div>
            <div 
              className="prose prose-sm max-w-none text-[15px] leading-relaxed text-[var(--color-text)]"
              dangerouslySetInnerHTML={{ __html: tafsir.text }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}