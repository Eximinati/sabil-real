'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAudioPlayer, AudioState, AudioFile, AudioControls } from '@/hooks/use-audio-player';

interface AudioPlayerStateContextValue {
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

interface AudioPlayerControlsContextValue {
  controls: AudioControls;
  controlsRef: React.MutableRefObject<AudioControls>;
}

const AudioPlayerStateContext = createContext<AudioPlayerStateContextValue | null>(null);
const AudioPlayerControlsContext = createContext<AudioPlayerControlsContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioPlayer = useAudioPlayer();

  const stateValue = useMemo(() => ({
    state: audioPlayer.state,
    playVerse: audioPlayer.playVerse,
    playSurah: audioPlayer.playSurah,
    play: audioPlayer.play,
    pause: audioPlayer.pause,
    toggle: audioPlayer.toggle,
    seek: audioPlayer.seek,
    clearError: audioPlayer.clearError,
    nextVerse: audioPlayer.nextVerse,
    previousVerse: audioPlayer.previousVerse,
    setPlaybackSpeed: audioPlayer.setPlaybackSpeed,
    resetPlayer: audioPlayer.resetPlayer,
    replaySurah: audioPlayer.replaySurah,
    audioFiles: audioPlayer.audioFiles,
    setAudioFiles: audioPlayer.setAudioFiles,
  }), [
    audioPlayer.state,
    audioPlayer.playVerse,
    audioPlayer.playSurah,
    audioPlayer.play,
    audioPlayer.pause,
    audioPlayer.toggle,
    audioPlayer.seek,
    audioPlayer.clearError,
    audioPlayer.nextVerse,
    audioPlayer.previousVerse,
    audioPlayer.setPlaybackSpeed,
    audioPlayer.resetPlayer,
    audioPlayer.replaySurah,
    audioPlayer.audioFiles,
    audioPlayer.setAudioFiles,
  ]);

  const controlsValue = useMemo(() => ({
    controls: audioPlayer.controls,
    controlsRef: audioPlayer.controlsRef,
  }), [audioPlayer.controls, audioPlayer.controlsRef]);

  return (
    <AudioPlayerStateContext.Provider value={stateValue}>
      <AudioPlayerControlsContext.Provider value={controlsValue}>
        {children}
      </AudioPlayerControlsContext.Provider>
    </AudioPlayerStateContext.Provider>
  );
}

export function useAudioPlayerContext() {
  const context = useContext(AudioPlayerStateContext);
  if (!context) {
    throw new Error('useAudioPlayerContext must be used within AudioPlayerProvider');
  }
  return context;
}

export function useAudioPlayerControls() {
  const context = useContext(AudioPlayerControlsContext);
  if (!context) {
    throw new Error('useAudioPlayerControls must be used within AudioPlayerProvider');
  }
  return context;
}