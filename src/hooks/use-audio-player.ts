'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioState {
  isPlaying: boolean;
  currentVerseKey: string | null;
  currentChapter: number | null;
  reciterId: number | null;
  playbackSpeed: number;
  isCompleted: boolean;
  totalVerses: number;
  currentVerseIndex: number;
  error: string | null;
}

export interface AudioControls {
  currentTime: number;
  duration: number;
  isLoading: boolean;
}

export interface AudioFile {
  verse_key: string;
  url: string;
  duration: string | null;
}

export interface UseAudioPlayerReturn {
  state: AudioState;
  controls: AudioControls;
  controlsRef: React.MutableRefObject<AudioControls>;
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

const RECITER_STORAGE_KEY = 'sabil-reciter-id';
const SPEED_STORAGE_KEY = 'sabil-playback-speed';
const SPEEDS = [0.75, 1, 1.25, 1.5];

function parseDuration(durationStr: string | null): number {
  if (!durationStr) return 0;
  const parts = durationStr.split(':');
  if (parts.length === 3) {
    const [h, m, s] = parts.map(Number);
    return h * 3600 + m * 60 + s;
  } else if (parts.length === 2) {
    const [m, s] = parts.map(Number);
    return m * 60 + s;
  }
  return parseFloat(durationStr) || 0;
}

const QURAN_AUDIO_BASE = 'https://verses.quran.foundation';

function resolveAudioUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.replace('cdn.quran.com', 'verses.quran.foundation');
  }
  return `${QURAN_AUDIO_BASE}/${url}`;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioFilesRef = useRef<AudioFile[] | null>(null);
  const currentChapterRef = useRef<number | null>(null);
  const currentReciterRef = useRef<number | null>(null);

  const controlsRef = useRef<AudioControls>({
    currentTime: 0,
    duration: 0,
    isLoading: false,
  });

  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentVerseKey: null,
    currentChapter: null,
    reciterId: null,
    error: null,
    playbackSpeed: 1,
    isCompleted: false,
    totalVerses: 0,
    currentVerseIndex: 0,
  });

  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [audioFiles, setAudioFiles] = useState<AudioFile[] | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSpeed = localStorage.getItem(SPEED_STORAGE_KEY);
      if (storedSpeed) {
        setState(prev => ({ ...prev, playbackSpeed: parseFloat(storedSpeed) }));
      }
    }
  }, []);

  const playNextVerse = useCallback(() => {
    const files = audioFilesRef.current;
    if (!files || files.length === 0) {
      setState(prev => ({ ...prev, isPlaying: false, isCompleted: true }));
      return;
    }

    setState(prev => {
      const currentIndex = prev.currentVerseIndex;
      const nextIndex = currentIndex + 1;

      if (nextIndex >= files.length) {
        controlsRef.current.currentTime = 0;
        return { ...prev, isPlaying: false, isCompleted: true };
      }

      const nextAudio = files[nextIndex];
      const resolvedUrl = resolveAudioUrl(nextAudio.url);

      if (!resolvedUrl) {
        return { ...prev, isPlaying: false, error: 'Invalid audio URL' };
      }

      controlsRef.current.currentTime = 0;
      controlsRef.current.duration = 0;
      controlsRef.current.isLoading = true;

      setCurrentUrl(resolvedUrl);
      if (audioRef.current) {
        audioRef.current.src = resolvedUrl;
        audioRef.current.load();
        audioRef.current.play().catch(() => {});
      }

      return {
        ...prev,
        currentVerseKey: nextAudio.verse_key,
        currentVerseIndex: nextIndex,
      };
    });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.playbackRate = state.playbackSpeed;

      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          controlsRef.current.currentTime = audioRef.current.currentTime;
        }
      });
      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) {
          controlsRef.current.duration = audioRef.current.duration;
          controlsRef.current.isLoading = false;
        }
      });
      audioRef.current.addEventListener('ended', () => {
        playNextVerse();
      });
      audioRef.current.addEventListener('error', () => {
        controlsRef.current.isLoading = false;
        setState(prev => ({ ...prev, isPlaying: false, error: 'Audio failed to load' }));
      });
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [playNextVerse]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = state.playbackSpeed;
    }
  }, [state.playbackSpeed]);

  const playVerse = useCallback((verseKey: string, chapter: number, reciter: number, audioUrl: string, verseIndex?: number) => {
    if (!audioRef.current) return;

    const resolvedUrl = resolveAudioUrl(audioUrl);
    if (!resolvedUrl) {
      setState(prev => ({ ...prev, error: 'Invalid audio URL' }));
      return;
    }

    controlsRef.current.isLoading = true;
    setState(prev => ({ ...prev, error: null, isPlaying: true, isCompleted: false }));
    setCurrentUrl(resolvedUrl);
    audioFilesRef.current = null;
    setAudioFiles(null);
    currentReciterRef.current = reciter;
    currentChapterRef.current = chapter;

    audioRef.current.src = resolvedUrl;
    audioRef.current.load();

    controlsRef.current.currentTime = 0;
    controlsRef.current.duration = 0;

    setState(prev => ({
      ...prev,
      currentVerseKey: verseKey,
      currentChapter: chapter,
      reciterId: reciter,
      currentVerseIndex: verseIndex ?? 0,
    }));

    audioRef.current.play().then(() => {
      controlsRef.current.isLoading = false;
    }).catch(() => {
      controlsRef.current.isLoading = false;
      setState(prev => ({ ...prev, isPlaying: false }));
    });
  }, []);

  const playSurah = useCallback((chapter: number, reciter: number, files: AudioFile[]) => {
    if (files.length === 0) return;

    audioFilesRef.current = files;
    setAudioFiles(files);
    currentReciterRef.current = reciter;
    currentChapterRef.current = chapter;

    const firstAudio = files[0];
    const resolvedUrl = resolveAudioUrl(firstAudio.url);

    if (!resolvedUrl) {
      setState(prev => ({ ...prev, error: 'Invalid audio URL' }));
      return;
    }

    controlsRef.current.isLoading = true;
    controlsRef.current.currentTime = 0;
    controlsRef.current.duration = 0;

    setState({
      isPlaying: true,
      currentVerseKey: firstAudio.verse_key,
      currentChapter: chapter,
      reciterId: reciter,
      error: null,
      playbackSpeed: state.playbackSpeed,
      isCompleted: false,
      totalVerses: files.length,
      currentVerseIndex: 0,
    });

    setCurrentUrl(resolvedUrl);
    audioRef.current!.src = resolvedUrl;
    audioRef.current!.load();
    audioRef.current!.play().then(() => {
      controlsRef.current.isLoading = false;
    }).catch(() => {
      controlsRef.current.isLoading = false;
      setState(prev => ({ ...prev, isPlaying: false }));
    });
  }, [state.playbackSpeed]);

  const play = useCallback(() => {
    if (audioRef.current && currentUrl) {
      audioRef.current.play().catch(() => {});
    }
  }, [currentUrl]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const toggle = useCallback(() => {
    if (state.isPlaying) {
      pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    } else {
      play();
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, [state.isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      controlsRef.current.currentTime = time;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const nextVerse = useCallback(() => {
    const files = audioFilesRef.current;
    if (!files || files.length === 0) return;

    setState(prev => {
      const nextIndex = prev.currentVerseIndex + 1;
      if (nextIndex >= files.length) return prev;

      const nextAudio = files[nextIndex];
      const resolvedUrl = resolveAudioUrl(nextAudio.url);

      if (!resolvedUrl) return { ...prev, error: 'Invalid audio URL' };

      controlsRef.current.currentTime = 0;
      controlsRef.current.duration = 0;
      controlsRef.current.isLoading = true;

      setCurrentUrl(resolvedUrl);
      if (audioRef.current) {
        audioRef.current.src = resolvedUrl;
        audioRef.current.load();
        audioRef.current.play().then(() => {
          controlsRef.current.isLoading = false;
        }).catch(() => {
          controlsRef.current.isLoading = false;
          setState(s => ({ ...s, isPlaying: false }));
        });
      }

      return {
        ...prev,
        currentVerseKey: nextAudio.verse_key,
        currentVerseIndex: nextIndex,
        isCompleted: false,
      };
    });
  }, []);

  const previousVerse = useCallback(() => {
    const files = audioFilesRef.current;
    if (!files || files.length === 0) return;

    setState(prev => {
      const prevIndex = prev.currentVerseIndex - 1;
      if (prevIndex < 0) return prev;

      const prevAudio = files[prevIndex];
      const resolvedUrl = resolveAudioUrl(prevAudio.url);

      if (!resolvedUrl) return { ...prev, error: 'Invalid audio URL' };

      controlsRef.current.currentTime = 0;
      controlsRef.current.duration = 0;
      controlsRef.current.isLoading = true;

      setCurrentUrl(resolvedUrl);
      if (audioRef.current) {
        audioRef.current.src = resolvedUrl;
        audioRef.current.load();
        audioRef.current.play().then(() => {
          controlsRef.current.isLoading = false;
        }).catch(() => {
          controlsRef.current.isLoading = false;
          setState(s => ({ ...s, isPlaying: false }));
        });
      }

      return {
        ...prev,
        currentVerseKey: prevAudio.verse_key,
        currentVerseIndex: prevIndex,
        isCompleted: false,
      };
    });
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, playbackSpeed: speed }));
    if (typeof window !== 'undefined') {
      localStorage.setItem(SPEED_STORAGE_KEY, speed.toString());
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, []);

  const resetPlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    audioFilesRef.current = null;
    setAudioFiles(null);
    setCurrentUrl(null);
    controlsRef.current = { currentTime: 0, duration: 0, isLoading: false };
    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentVerseKey: null,
      currentChapter: null,
      reciterId: null,
      error: null,
      isCompleted: false,
      totalVerses: 0,
      currentVerseIndex: 0,
    }));
  }, []);

  const replaySurah = useCallback(() => {
    const files = audioFilesRef.current;
    const reciter = currentReciterRef.current;
    const chapter = currentChapterRef.current;
    
    if (!files || files.length === 0 || !reciter || !chapter) return;
    playSurah(chapter, reciter, files);
  }, [playSurah]);

  useEffect(() => {
    if (audioRef.current) {
      if (state.isPlaying && currentUrl && audioRef.current.src !== currentUrl) {
        audioRef.current.play().catch(() => {});
      } else if (!state.isPlaying && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    }
  }, [state.isPlaying, currentUrl]);

  const controls: AudioControls = {
    currentTime: controlsRef.current.currentTime,
    duration: controlsRef.current.duration,
    isLoading: controlsRef.current.isLoading,
  };

  return {
    state,
    controls,
    controlsRef,
    playVerse,
    playSurah,
    play,
    pause,
    toggle,
    seek,
    clearError,
    nextVerse,
    previousVerse,
    setPlaybackSpeed,
    resetPlayer,
    replaySurah,
    audioFiles,
    setAudioFiles,
  };
}

export function getStoredReciterId(): number | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(RECITER_STORAGE_KEY);
  return stored ? parseInt(stored, 10) : null;
}

export function setStoredReciterId(id: number): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(RECITER_STORAGE_KEY, id.toString());
  }
}

export { SPEEDS };