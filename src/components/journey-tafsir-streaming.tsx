'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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
  const [isCondensed, setIsCondensed] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const fetchedRef = useRef(false);

  const verseKeyRef = useRef(verseKeys.join(','));
  const tafsirIdRef = useRef(tafsirId);

  useEffect(() => {
    verseKeyRef.current = verseKeys.join(',');
    tafsirIdRef.current = tafsirId;
  }, [verseKeys, tafsirId]);

  const loadTafsirs = useCallback(async () => {
    if (fetchedRef.current || hasTriedLoading) return;
    
    const verseNumbers = verseKeyRef.current.split(':').filter((_, i) => i % 2 === 1).filter(Boolean);
    const chapterId = verseKeys[0]?.split(':')[0];
    
    if (!chapterId || verseNumbers.length === 0) {
      setHasTriedLoading(true);
      return;
    }

    fetchedRef.current = true;
    setLoading(true);
    
    try {
      const res = await fetch(`/api/tafsirs/${tafsirIdRef.current}/${chapterId}`);
      
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
  }, [verseKeys, hasTriedLoading]);

  useEffect(() => {
    if (isExpanded && !hasTriedLoading) {
      loadTafsirs();
    }
  }, [isExpanded, hasTriedLoading, loadTafsirs]);

  const toggleExpanded = useCallback(() => {
    if (!isExpanded && !hasTriedLoading) {
      fetchedRef.current = false;
      setHasTriedLoading(false);
      setTafsirs([]);
      setError(null);
    }
    setIsExpanded(prev => !prev);
  }, [isExpanded, hasTriedLoading]);

  const stripHtml = useCallback((html: string): string => {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const getCondensedText = useCallback((html: string): string => {
    const plain = stripHtml(html);
    if (!plain) return '';

    const sentences = plain
      .match(/[^.!?]+[.!?]*/g)
      || [];

    const normalized = sentences
      .map((s) => s.trim())
      .filter(Boolean);

    if (normalized.length === 0) {
      return plain.slice(0, 260).trim() + (plain.length > 260 ? '…' : '');
    }

    const condensed = normalized.slice(0, 3).join(' ');
    return condensed.length < plain.length ? `${condensed}…` : condensed;
  }, [stripHtml]);

  const toggleCardExpand = useCallback((idx: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  }, []);

  if (!isExpanded) {
    return (
      <div className="mb-8">
        <button
          onClick={toggleExpanded}
          className="flex w-full items-center justify-between rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]/82 px-4 py-4 text-left transition-colors hover:border-[var(--color-primary)]/35"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">Open tafsir notes</p>
              <p className="text-xs text-[var(--color-text-muted)]">Scholar context appears only when you ask for it.</p>
            </div>
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
        <div className="flex w-full items-center justify-between rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]/82 p-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-[var(--color-border)] rounded" />
            <div className="w-16 h-5 bg-[var(--color-border)] rounded" />
          </div>
          <div className="w-5 h-5 bg-[var(--color-border)] rounded" />
        </div>
        <div className="mt-3 space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/82 p-4">
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
          className="flex w-full items-center justify-between rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]/82 p-4"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="font-medium text-[var(--color-text)]">Tafsir notes</span>
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
        <div className="mt-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/82 p-4">
          <p className="text-sm text-[var(--color-text-muted)]">No tafsir available for these verses yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsExpanded(false)}
        className="flex w-full items-center justify-between rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]/82 p-4"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">Tafsir notes</p>
            <p className="text-xs text-[var(--color-text-muted)]">Supportive context from your selected scholar.</p>
          </div>
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
        <div className="mb-2 flex justify-end">
          <button
            onClick={() => setIsCondensed((prev) => !prev)}
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/35"
          >
            {isCondensed ? 'Show full tafsir' : 'Condensed tafsir'}
          </button>
        </div>

        {tafsirs.slice(0, 3).map((tafsir, idx) => (
          <div key={idx} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/82 p-5 md:p-6">
            <div className="text-xs text-[var(--color-primary)] mb-2">
              Verse {tafsir.verse_number}
              {tafsir.resource_name && (
                <span className="text-[var(--color-text-muted)] ml-2">
                  — {tafsir.resource_name}
                </span>
              )}
            </div>
            {isCondensed && !expandedCards[idx] ? (
              <>
                <p className="text-[15px] leading-[1.85] text-[var(--color-text)]">
                  {getCondensedText(tafsir.text)}
                </p>
                <button
                  onClick={() => toggleCardExpand(idx)}
                  className="mt-3 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                >
                  Read full tafsir
                </button>
              </>
            ) : (
              <>
                <div
                  className="prose prose-sm max-w-none text-[15px] leading-[1.85] text-[var(--color-text)]"
                  dangerouslySetInnerHTML={{ __html: tafsir.text }}
                />
                {isCondensed && (
                  <button
                    onClick={() => toggleCardExpand(idx)}
                    className="mt-3 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                  >
                    Show condensed tafsir
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
