'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAudioPlayer, AudioState } from '@/hooks/use-audio-player';

interface AudioPlayerContextValue {
  state: AudioState;
  playVerse: (verseKey: string, chapter: number, reciter: number, audioUrl: string) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  clearError: () => void;
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