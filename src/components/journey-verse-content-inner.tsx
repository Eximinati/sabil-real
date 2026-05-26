'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { JourneyVerseSection } from './journey-verse-section';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/lib/api-url';
import { useLanguage } from '@/lib/i18n/context';

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
  title?: string;
  intro?: string;
  referenceLabel?: string;
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

export function JourneyVerseContentInner({
  verseKeys,
  translationId,
  title,
  intro,
  referenceLabel,
}: JourneyVerseContentInnerProps) {
  const router = useSearchParams();
  const { language } = useLanguage();
  const isUrdu = language === 'ur';
  const uiCopy = isUrdu
    ? {
        sectionTitle: 'آج کے لیے قرآن',
        fetchFailed: 'آیات لوڈ نہیں ہو سکیں',
        audioUnavailable: 'اس آیت کے لیے آڈیو دستیاب نہیں',
        audioFailed: 'آڈیو چل نہیں سکی',
        errorTitle: 'آیات لوڈ نہیں ہو سکیں',
        errorDescription: 'براہ کرم کنکشن چیک کریں اور دوبارہ کوشش کریں۔',
        empty: 'اس سبق کے لیے ابھی آیات دستیاب نہیں۔',
      }
    : {
        sectionTitle: 'Quran for today',
        fetchFailed: 'Failed to load verses',
        audioUnavailable: 'Audio not available for this verse',
        audioFailed: 'Failed to play audio',
        errorTitle: 'Unable to load verses',
        errorDescription: 'Please check your connection and try again.',
        empty: 'No verses available for this lesson.',
      };
  const [verses, setVerses] = useState<VerseWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPlayingVerse, setCurrentPlayingVerse] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [reciterId, setReciterId] = useState<number>(5);
  const [fetchKey, setFetchKey] = useState(0);
  const toast = useToast();

  const urlTranslation = router.get('translation');
  const currentTranslation = urlTranslation ? parseInt(urlTranslation, 10) : translationId;
  const verseKeysParam = verseKeys.join(',');

  useEffect(() => {
    const stored = localStorage.getItem('sabil-reciter-id');
    if (stored) {
      setReciterId(parseInt(stored, 10));
    }
  }, []);

  useEffect(() => {
    setFetchKey(k => k + 1);
  }, [verseKeysParam, currentTranslation, reciterId]);

  useEffect(() => {
    if (fetchKey === 0) return;
    
    const startTime = performance.now();
    setLoading(true);
    
    async function fetchVerses() {
      try {
        const res = await fetch(getApiUrl(`/verses?verse_keys=${verseKeysParam}&translation=${currentTranslation}&reciter=${reciterId}`));
        if (!res.ok) throw new Error('Failed to fetch verses');
        const data = await res.json();
        setVerses(data.verses || []);
        logPerformance('Verse content loaded', performance.now() - startTime);
      } catch (err) {
        setError(uiCopy.fetchFailed);
      } finally {
        setLoading(false);
      }
    }
    
    fetchVerses();
  }, [fetchKey, currentTranslation, reciterId, uiCopy.fetchFailed, verseKeysParam]);

  const sectionTitle = title || uiCopy.sectionTitle;
  const isUrduIntro = /[\u0600-\u06FF]/.test(intro || '') || language === 'ur';

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
        toast.error(uiCopy.audioUnavailable);
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
          toast.error(uiCopy.audioFailed);
        });

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentPlayingVerse(null);
      };
    }
  };

  const showVerses = loading ? verseKeys.slice(0, 1).map((key, idx) => ({
    verse: null,
    chapterName: '',
    verseKey: key,
    audioUrl: undefined
  })) : verses;

  if (loading) {
    return (
      <div className="mb-10">
        <div className="mb-4">
          <h2 className="section-heading mb-0">{sectionTitle}</h2>
        </div>
        <div className="space-y-4">
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-4 animate-pulse">
            <div className="flex justify-end mb-2">
              <div className="w-12 h-4 bg-[var(--color-border)] rounded" />
            </div>
            <div className="w-full h-6 bg-[var(--color-border)] rounded mb-2" />
            <div className="w-3/4 h-4 bg-[var(--color-border)] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-10">
        <h2 className="section-heading mb-0">{sectionTitle}</h2>
        <div className="bg-[var(--color-bg)] border border-[var(--color-error)]/30 rounded-xl p-6 text-center mt-4">
          <svg className="w-10 h-10 mx-auto text-[var(--color-error)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-[var(--color-text)] font-medium mb-1">{uiCopy.errorTitle}</p>
          <p className="text-sm text-[var(--color-text-muted)]">{uiCopy.errorDescription}</p>
        </div>
      </div>
    );
  }

  if (verses.length === 0) {
    return (
      <div className="mb-10">
        <h2 className="section-heading mb-0">{sectionTitle}</h2>
        <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-6 text-center mt-4">
          <p className="text-[var(--color-text-muted)]">{uiCopy.empty}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reading-section">
      <h2 className="section-heading mb-4">{sectionTitle}</h2>
      {referenceLabel && (
        <p className="mb-3 text-xs uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
          {isUrdu ? 'قرآنی ماخذ' : 'Quran reference'}: {referenceLabel}
        </p>
      )}
      {intro && (
        <p
          className={`mb-6 max-w-3xl text-[var(--color-text-muted)] ${
            isUrduIntro ? 'font-urdu text-[17px] leading-[2.2]' : 'text-[15px] leading-[1.95] md:text-[16px]'
          }`}
          dir={isUrduIntro ? 'rtl' : 'ltr'}
          data-script-direction={isUrduIntro ? 'rtl' : 'ltr'}
        >
          {intro}
        </p>
      )}
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
