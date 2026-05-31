'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { fetchTafsir, startPeriodicCleanup } from '@/lib/tafsir-cache';
import type { TafsirCacheVerse } from '@/lib/tafsir-cache';
import type { CanonicalTafsirRevealMode } from '@/types/journey-localization';

interface TafsirData {
  text: string;
  verse_number: number;
  resource_name?: string;
}

interface JourneyTafsirStreamingProps {
  verseKeys: string[];
  tafsirId: number;
  initialRevealMode?: CanonicalTafsirRevealMode;
  initialExpanded?: boolean;
}

export function JourneyTafsirStreaming({
  verseKeys,
  tafsirId,
  initialRevealMode = 'condensed',
  initialExpanded = false,
}: JourneyTafsirStreamingProps) {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';
  const uiCopy = isUrdu
    ? {
        loadFailed: 'تفسیر لوڈ نہیں ہو سکی',
        openTitle: 'تفسیری نوٹس کھولیں',
        openHint: 'علمی پس منظر صرف آپ کے کھولنے پر ظاہر ہوگا۔',
        notesTitle: 'تفسیری نوٹس',
        empty: 'ان آیات کے لیے ابھی تفسیر دستیاب نہیں۔',
        notesHint: 'آپ کے منتخب عالم سے معاون سیاق۔',
        showFull: 'مکمل تفسیر دکھائیں',
        showCondensed: 'مختصر تفسیر',
        verseLabel: 'آیت',
        readFull: 'مکمل تفسیر پڑھیں',
        readCondensed: 'مختصر تفسیر دکھائیں',
      }
    : {
        loadFailed: 'Failed to load tafsir',
        openTitle: 'Open tafsir notes',
        openHint: 'Scholar context appears only when you ask for it.',
        notesTitle: 'Tafsir notes',
        empty: 'No tafsir available for these verses yet.',
        notesHint: 'Supportive context from your selected scholar.',
        showFull: 'Show full tafsir',
        showCondensed: 'Condensed tafsir',
        verseLabel: 'Verse',
        readFull: 'Read full tafsir',
        readCondensed: 'Show condensed tafsir',
      };
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [tafsirs, setTafsirs] = useState<TafsirData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTriedLoading, setHasTriedLoading] = useState(false);
  const [isCondensed, setIsCondensed] = useState(initialRevealMode !== 'full');
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const fetchedRef = useRef(false);

  const verseKeyRef = useRef(verseKeys.join(','));
  const tafsirIdRef = useRef(tafsirId);

  useEffect(() => {
    verseKeyRef.current = verseKeys.join(',');
    tafsirIdRef.current = tafsirId;
  }, [verseKeys, tafsirId]);

  useEffect(() => {
    setIsCondensed(initialRevealMode !== 'full');
  }, [initialRevealMode]);

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
      const cached = await fetchTafsir(tafsirIdRef.current, parseInt(chapterId, 10));
      const fetchedTafsirs = cached?.verses || [];
      
      const filtered = fetchedTafsirs.filter(
        (t: TafsirCacheVerse) => verseNumbers.includes(String(t.verse_number))
      );
      
      setTafsirs(filtered);
      setHasTriedLoading(true);
    } catch (err) {
      setError(uiCopy.loadFailed);
      setHasTriedLoading(true);
    } finally {
      setLoading(false);
    }
  }, [verseKeys, hasTriedLoading, uiCopy.loadFailed]);

  useEffect(() => {
    if (isExpanded && !hasTriedLoading) {
      loadTafsirs();
    }
  }, [isExpanded, hasTriedLoading, loadTafsirs]);

  useEffect(() => {
    startPeriodicCleanup();
  }, []);

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

  const sourceCopy = language === 'ur'
    ? {
        title: 'علمی ماخذ کی تفسیر',
        hint: 'یہ حصہ اہلِ علم کی تشریح ہے۔ Sabil کی رہنمائی سے الگ سمجھیں۔',
      }
    : {
        title: 'Scholarly source tafsir',
        hint: 'This section is scholar commentary and is separate from Sabil guidance.',
      };

  if (!isExpanded) {
    return (
      <div className="reading-section">
        <button
          onClick={toggleExpanded}
          className="quiet-controls flex w-full items-center justify-between rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]/82 px-4 py-4 text-left transition-colors hover:border-[var(--color-primary)]/35"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">{uiCopy.openTitle}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{uiCopy.openHint}</p>
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
      <div className="reading-section animate-pulse">
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
      <div className="reading-section">
        <button
          onClick={() => setIsExpanded(false)}
          className="flex w-full items-center justify-between rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]/82 p-4"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="font-medium text-[var(--color-text)]">{uiCopy.notesTitle}</span>
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
          <p className="text-sm text-[var(--color-text-muted)]">{uiCopy.empty}</p>
        </div>
      </div>
    );
  }

  return (
      <div className="reading-section">
      <button
        onClick={() => setIsExpanded(false)}
        className="flex w-full items-center justify-between rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]/82 p-4"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">{uiCopy.notesTitle}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{uiCopy.notesHint}</p>
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
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-3">
          <p className="text-xs font-medium text-[var(--color-primary)]">{sourceCopy.title}</p>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{sourceCopy.hint}</p>
        </div>

        <div className="quiet-controls mb-2 flex justify-end">
          <button
            onClick={() => setIsCondensed((prev) => !prev)}
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/35"
          >
            {isCondensed ? uiCopy.showFull : uiCopy.showCondensed}
          </button>
        </div>

        {tafsirs.slice(0, 3).map((tafsir, idx) => (
          <div key={idx} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/82 p-5 md:p-6">
            <div className="text-xs text-[var(--color-primary)] mb-2">
              {uiCopy.verseLabel} {tafsir.verse_number}
              {tafsir.resource_name && (
                <span className="text-[var(--color-text-muted)] ml-2">
                  — {tafsir.resource_name}
                </span>
              )}
            </div>
            {isCondensed && !expandedCards[idx] ? (
              <>
                <p className="text-[15px] leading-[1.95] text-[var(--color-text)]">
                  {getCondensedText(tafsir.text)}
                </p>
                <button
                  onClick={() => toggleCardExpand(idx)}
                  className="mt-3 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                >
                  {uiCopy.readFull}
                </button>
              </>
            ) : (
              <>
                <div
                  className="prose prose-sm max-w-none text-[15px] leading-[1.95] text-[var(--color-text)]"
                  dangerouslySetInnerHTML={{ __html: tafsir.text }}
                />
                {isCondensed && (
                  <button
                    onClick={() => toggleCardExpand(idx)}
                    className="mt-3 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                  >
                    {uiCopy.readCondensed}
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
