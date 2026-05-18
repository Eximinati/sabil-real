'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAudioPlayer, AudioState, AudioFile } from '@/hooks/use-audio-player';

interface AudioPlayerContextValue {
  state: AudioState;
  playVerse: (verseKey: string, chapter: number, reciter: number, audioUrl: string, verseIndex?: number) => void;
  playSurah: (chapter: number, reciter: number, audioFiles: AudioFile[]) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  clearError: () => void;
  nextVerse: () => void;
  previousVerse: () => void;
  setPlaybackSpeed: (speed: number) => void;
  resetPlayer: () => void;
  replaySurah: () => void;
  audioFiles: AudioFile[] | null;
  setAudioFiles: (files: AudioFile[]) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioPlayer = useAudioPlayer();

  return (
    <AudioPlayerContext.Provider value={audioPlayer}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayerContext() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayerContext must be used within AudioPlayerProvider');
  }
  return context;
}