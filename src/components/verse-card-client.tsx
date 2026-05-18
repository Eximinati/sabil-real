'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAudioPlayerContext } from './audio-player-provider';
import { useToast } from '@/hooks/use-toast';
import { getStoredReciterId } from '@/hooks/use-audio-player';
import { CopyButton } from './copy-button';

interface AudioFile {
  verse_key: string;
  url: string;
  duration: string | null;
}

interface VerseCardProps {
  verse: {
    id: number;
    verse_key: string;
    text_uthmani: string;
    translations?: Array<{
      text: string;
      resource_id: number;
      resource_name: string;
    }>;
  };
  verseNumber: number;
  verseIndex: number;
  chapterId: number;
  translatorLabel: string;
  translationId: number;
}

export function VerseCardClient({ verse, verseNumber, verseIndex, chapterId, translatorLabel, translationId }: VerseCardProps) {
  const { state, playSurah } = useAudioPlayerContext();
  const toast = useToast();
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [cachedAudio, setCachedAudio] = useState<Record<number, AudioFile[]>>({});
  const cardRef = useRef<HTMLDivElement>(null);

  const isActive = state.currentVerseKey === verse.verse_key;
  const isPlaying = isActive && state.isPlaying;
  const translation = verse.translations?.find(t => t.resource_id === translationId);

  useEffect(() => {
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isActive]);

  const handlePlayClick = async () => {
    const reciterId = getStoredReciterId() || 5;
    
    let files = cachedAudio[reciterId];
    if (!files) {
      setLoadingAudio(true);
      try {
        const res = await fetch(`/api/audio/${reciterId}/${chapterId}`);
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);
        
        files = data.audio_files || [];
        setCachedAudio(prev => ({ ...prev, [reciterId]: files }));
      } catch {
        toast.error('Failed to load audio');
        setLoadingAudio(false);
        return;
      }
      setLoadingAudio(false);
    }
    
    if (files.length > 0) {
      playSurah(chapterId, reciterId, files);
    } else {
      toast.error('Audio not available');
    }
  };

  return (
    <div
      ref={cardRef}
      className={`bg-[var(--color-surface)] border rounded-xl p-4 md:p-6 mb-4 transition-all duration-300 relative group ${
        isActive
          ? 'border-[var(--color-primary)] shadow-[0_0_12px_-4px_var(--color-primary)] bg-[var(--color-primary)]/[0.03]'
          : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
      }`}
    >
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <button
          onClick={handlePlayClick}
          disabled={loadingAudio}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all flex-shrink-0 ${
            isActive
              ? 'bg-[var(--color-primary)] text-white shadow-lg'
              : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)]'
          } ${isPlaying ? 'animate-pulse-soft' : ''}`}
          aria-label={isPlaying ? 'Pause' : 'Play verse'}
        >
          {loadingAudio ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <CopyButton text={verse.text_uthmani} translation={translation?.text} />
      </div>

      <div className="flex items-start mb-4">
        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium transition-colors ${
          isActive
            ? 'bg-[var(--color-primary)] text-white'
            : 'bg-[var(--color-accent)] text-white'
        }`}>
          {verseNumber}
        </span>
      </div>
      <p
        className="font-arabic text-[22px] md:text-[26px] leading-[2.2] text-[var(--color-text)] text-right mb-4"
        dir="rtl"
      >
        {verse.text_uthmani}
      </p>
      <div className="border-t border-[var(--color-border)] pt-4">
        <p className="text-xs text-[var(--color-text-muted)] mb-2">{translatorLabel}</p>
        <p className="text-[var(--color-text-secondary)] text-[14px] md:text-[15px] leading-[1.8]">
          {translation?.text || 'Translation unavailable'}
        </p>
        <div className="mt-3 text-right">
          <Link
            href={`/tafsir?surah=${chapterId}&verse=${verseNumber}`}
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            Tafsir →
          </Link>
        </div>
      </div>
    </div>
  );
}