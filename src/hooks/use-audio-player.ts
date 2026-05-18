'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioState {
  isPlaying: boolean;
  currentVerseKey: string | null;
  currentChapter: number | null;
  reciterId: number | null;
  duration: number;
  currentTime: number;
  isLoading: boolean;
  error: string | null;
}

export interface AudioFile {
  verse_key: string;
  url: string;
  duration: string | null;
}

interface UseAudioPlayerReturn {
  state: AudioState;
  playVerse: (verseKey: string, chapter: number, reciter: number, audioUrl: string) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  clearError: () => void;
}

const RECITER_STORAGE_KEY = 'sabil-reciter-id';

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

export function useAudioPlayer(): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentVerseKey: null,
    currentChapter: null,
    reciterId: null,
    duration: 0,
    currentTime: 0,
    isLoading: false,
    error: null,
  });

  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setState(prev => ({ ...prev, currentTime: audioRef.current!.currentTime }));
        }
      });
      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) {
          setState(prev => ({ ...prev, duration: audioRef.current!.duration, isLoading: false }));
        }
      });
      audioRef.current.addEventListener('ended', () => {
        setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      });
      audioRef.current.addEventListener('error', (e) => {
        const mediaError = audioRef.current?.error;
        let errorMsg = 'Audio failed to load';
        if (mediaError) {
          switch (mediaError.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMsg = 'Audio playback aborted';
              break;
            case MediaError.MEDIA_ERR_NETWORK:
              errorMsg = 'Network error loading audio';
              break;
            case MediaError.MEDIA_ERR_DECODE:
              errorMsg = 'Audio decoding error';
              break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMsg = 'Audio format not supported';
              break;
          }
        }
        setState(prev => ({ ...prev, isPlaying: false, isLoading: false, error: errorMsg }));
      });
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

const QURAN_AUDIO_BASE = 'https://verses.quran.foundation';

  const resolveAudioUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url.replace('cdn.quran.com', 'verses.quran.foundation');
    }
    return `${QURAN_AUDIO_BASE}/${url}`;
  };

  const playVerse = useCallback((verseKey: string, chapter: number, reciter: number, audioUrl: string) => {
    if (!audioRef.current) return;

    const resolvedUrl = resolveAudioUrl(audioUrl);
    if (!resolvedUrl) {
      setState(prev => ({ ...prev, error: 'Invalid audio URL' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, isPlaying: true }));
    setCurrentUrl(resolvedUrl);
    audioRef.current.src = resolvedUrl;
    audioRef.current.load();

    setState(prev => ({
      ...prev,
      currentVerseKey: verseKey,
      currentChapter: chapter,
      reciterId: reciter,
      currentTime: 0,
      duration: 0,
    }));

    audioRef.current.play().then(() => {
      setState(prev => ({ ...prev, isLoading: false }));
    }).catch((err) => {
      setState(prev => ({ ...prev, isPlaying: false, isLoading: false, error: 'Audio failed to load' }));
    });
  }, []);

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
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (state.isPlaying && currentUrl && audioRef.current.src !== currentUrl) {
        audioRef.current.play().catch(() => {});
      } else if (!state.isPlaying && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    }
  }, [state.isPlaying, currentUrl]);

  return { state, playVerse, play, pause, toggle, seek, clearError };
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