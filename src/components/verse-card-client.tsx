'use client';

import { useState, useCallback } from 'react';
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
  chapterId: number;
  translatorLabel: string;
  translationId: number;
}

export function VerseCardClient({ verse, verseNumber, chapterId, translatorLabel, translationId }: VerseCardProps) {
  const { state, playVerse } = useAudioPlayerContext();
  const toast = useToast();
  const [loadingAudio, setLoadingAudio] = useState(false);

  const isActive = state.currentVerseKey === verse.verse_key;
  const translation = verse.translations?.find(t => t.resource_id === translationId);

  const handlePlayClick = async () => {
    const currentReciterId = getStoredReciterId() || 5;
    setLoadingAudio(true);
    
    try {
      const res = await fetch(`/api/audio/${currentReciterId}/${chapterId}`);
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      
      const audioFiles: AudioFile[] = data.audio_files || [];
      const audio = audioFiles.find((f: AudioFile) => f.verse_key === verse.verse_key);
      
      if (audio?.url) {
        playVerse(verse.verse_key, chapterId, currentReciterId, audio.url);
      } else {
        toast.error('Audio not available for this verse');
      }
    } catch (error) {
      toast.error('Failed to load audio');
    } finally {
      setLoadingAudio(false);
    }
  };

  return (
    <div
      className={`bg-[var(--color-surface)] border rounded-xl p-4 md:p-6 mb-4 transition-all relative group ${
        isActive
          ? 'border-[var(--color-primary)] shadow-[0_0_0_1px_var(--color-primary)] bg-[var(--color-primary)]/5'
          : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
      }`}
    >
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <button
          onClick={handlePlayClick}
          disabled={loadingAudio}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all flex-shrink-0 ${
            isActive
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)]'
          }`}
          aria-label={isActive && state.isPlaying ? 'Pause' : 'Play verse'}
        >
          {loadingAudio ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : isActive && state.isPlaying ? (
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
        <span className="w-7 h-7 flex items-center justify-center bg-[var(--color-accent)] text-white rounded-full text-xs font-medium">
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