'use client';

import { useState, useEffect } from 'react';
import { useAudioPlayerContext } from './audio-player-provider';
import { getStoredReciterId } from '@/hooks/use-audio-player';
import { useToast } from '@/hooks/use-toast';

interface AudioFile {
  verse_key: string;
  url: string;
  duration: string | null;
}

interface SurahControlsProps {
  chapterId: number;
}

export function SurahControls({ chapterId }: SurahControlsProps) {
  const { state, playSurah, audioFiles } = useAudioPlayerContext();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [cachedAudio, setCachedAudio] = useState<Record<number, AudioFile[]>>({});

  const isCurrentlyPlaying = state.currentChapter === chapterId && state.isPlaying;

  const loadAudioFiles = async () => {
    const reciterId = getStoredReciterId() || 5;
    
    if (cachedAudio[reciterId]) {
      return cachedAudio[reciterId];
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/audio/${reciterId}/${chapterId}`);
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      
      const files: AudioFile[] = data.audio_files || [];
      setCachedAudio(prev => ({ ...prev, [reciterId]: files }));
      return files;
    } catch (error) {
      toast.error('Failed to load audio');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySurah = async () => {
    const reciterId = getStoredReciterId() || 5;
    let files = cachedAudio[reciterId];
    
    if (!files) {
      files = await loadAudioFiles();
    }
    
    if (files.length > 0) {
      playSurah(chapterId, reciterId, files);
    }
  };

  const handlePauseSurah = () => {
    const audio = document.querySelector('audio');
    if (audio) audio.pause();
  };

  return (
    <button
      onClick={isCurrentlyPlaying ? handlePauseSurah : handlePlaySurah}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary)] text-white text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : isCurrentlyPlaying ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
      <span>{isCurrentlyPlaying ? 'Pause Surah' : 'Play Surah'}</span>
    </button>
  );
}