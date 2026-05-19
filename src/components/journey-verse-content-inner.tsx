'use client';

import { useState, useEffect, useTransition, startTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { JourneyVerseSection } from './journey-verse-section';
import { JourneyTranslationSelector } from './journey-translation-selector';
import { JourneyReciterSelector } from './journey-reciter-selector';
import { useToast } from '@/hooks/use-toast';

const QURAN_AUDIO_BASE = 'https://verses.quran.foundation';

interface VerseData {
  verse_key: string;
  text_uthmani: string;
  translations?: Array<{
    resource_name: string;
    text: string;
  }>;
}

interface VerseWithData {
  verse: VerseData | null;
  chapterName: string;
  verseKey: string;
  audioUrl?: string;
}

interface JourneyVerseContentInnerProps {
  verseKeys: string[];
  translationId: number;
  lessonId: string;
}

function resolveAudioUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.replace('cdn.quran.com', 'verses.quran.foundation');
  }
  return `${QURAN_AUDIO_BASE}/${url}`;
}

function logPerformance(metric: string, value: number) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${metric}: ${value.toFixed(2)}ms`);
  }
}

export function JourneyVerseContentInner({ verseKeys, translationId }: JourneyVerseContentInnerProps) {
  const router = useSearchParams();
  const [verses, setVerses] = useState<VerseWithData[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startLoadTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentPlayingVerse, setCurrentPlayingVerse] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [reciterId, setReciterId] = useState<number>(5);
  const toast = useToast();

  const urlTranslation = router.get('translation');
  const currentTranslation = urlTranslation ? parseInt(urlTranslation, 10) : translationId;

  useEffect(() => {
    const stored = localStorage.getItem('sabil-reciter-id');
    if (stored) {
      setReciterId(parseInt(stored, 10));
    }
  }, []);

  useEffect(() => {
    const startTime = performance.now();
    
    async function fetchVerses() {
      try {
        const res = await fetch(`/api/verses?verse_keys=${verseKeys.join(',')}&translation=${currentTranslation}&reciter=${reciterId}`);
        if (!res.ok) throw new Error('Failed to fetch verses');
        const data = await res.json();
        const fetchedVerses = data.verses || [];
        
        startLoadTransition(() => {
          setVerses(fetchedVerses);
          setLoadedCount(fetchedVerses.length);
          logPerformance('Verse content loaded', performance.now() - startTime);
        });
      } catch (err) {
        setError('Failed to load verses');
      } finally {
        setLoading(false);
      }
    }
    fetchVerses();
  }, [verseKeys.join(','), currentTranslation, reciterId, startLoadTransition]);

  const handleReciterChange = (id: number) => {
    setReciterId(id);
    localStorage.setItem('sabil-reciter-id', id.toString());
    toast.success('Reciter updated');
  };

  const getAudioUrl = (verseKey: string): string => {
    const chapter = verseKey.split(':')[0];
    const verse = verseKey.split(':')[1];
    return `${QURAN_AUDIO_BASE}/audio-recitation/${reciterId}/${chapter}/${verse}.mp3`;
  };

  const playAudio = (verseKey: string, providedUrl?: string) => {
    if (!audio) {
      const newAudio = new Audio();
      setAudio(newAudio);
    }

    if (audio) {
      if (currentPlayingVerse === verseKey && isPlaying) {
        audio.pause();
        setIsPlaying(false);
        return;
      }

      const verseData = verses.find(v => v.verseKey === verseKey);
      let url = providedUrl || verseData?.audioUrl;
      
      if (!url) {
        url = getAudioUrl(verseKey);
      } else {
        url = resolveAudioUrl(url);
      }
      
      if (!url) {
        toast.error('Audio not available for this verse');
        return;
      }
      
      setLoadingAudio(true);
      audio.src = url;
      audio.play()
        .then(() => {
          setCurrentPlayingVerse(verseKey);
          setIsPlaying(true);
          setLoadingAudio(false);
        })
        .catch((err) => {
          console.error('Audio play error:', err);
          setLoadingAudio(false);
          toast.error('Failed to play audio');
        });

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentPlayingVerse(null);
      };
    }
  };

  const handlePlayAll = () => {
    if (!showVerses.length || showVerses[0].verse === null) return;

    if (!audio) {
      const newAudio = new Audio();
      setAudio(newAudio);
    }

    const playVerseAtIndex = (index: number) => {
      if (index >= showVerses.length) {
        setIsPlaying(false);
        setCurrentPlayingVerse(null);
        return;
      }

      const verse = showVerses[index];
      if (!verse.verseKey || !verse.audioUrl) {
        playVerseAtIndex(index + 1);
        return;
      }

      const url = resolveAudioUrl(verse.audioUrl);
      if (!url) {
        playVerseAtIndex(index + 1);
        return;
      }

      if (audio) {
        audio.src = url;
        audio.play()
          .then(() => {
            setCurrentPlayingVerse(verse.verseKey);
            setIsPlaying(true);
          })
          .catch(() => {
            playVerseAtIndex(index + 1);
          });

        audio.onended = () => {
          playVerseAtIndex(index + 1);
        };
      }
    };

    playVerseAtIndex(0);
  };

  const showVerses = loading ? verseKeys.slice(0, 1).map((key, idx) => ({
    verse: null,
    chapterName: '',
    verseKey: key,
    audioUrl: undefined
  })) : verses;

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-heading mb-0">Quranic Verses</h2>
          <div className="w-24 h-9 bg-[var(--color-border)] rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-4 animate-pulse">
            <div className="flex justify-end mb-2">
              <div className="w-12 h-4 bg-[var(--color-border)] rounded" />
            </div>
            <div className="w-full h-6 bg-[var(--color-border)] rounded mb-2" />
            <div className="w-3/4 h-4 bg-[var(--color-border)] rounded" />
          </div>
          {isPending && (
            <div className="flex items-center justify-center py-2 text-sm text-[var(--color-text-muted)]">
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading more verses...
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error || verses.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-heading mb-0">Quranic Verses</h2>
        <button
          onClick={handlePlayAll}
          disabled={loadingAudio}
          className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg text-sm hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50"
        >
          {loadingAudio ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          Play All
        </button>
      </div>
      <JourneyVerseSection
        verses={showVerses}
        reciterId={reciterId}
        onPlayAudio={(verseKey, url) => playAudio(verseKey, url)}
        currentPlayingVerse={currentPlayingVerse}
        isPlaying={isPlaying}
      />
    </div>
  );
}