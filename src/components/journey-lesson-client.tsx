'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { JourneyVerseSection } from './journey-verse-section';
import { JourneyTranslationSelector } from './journey-translation-selector';
import { TranslationLibrarySheet } from './translation-library-sheet';
import { JourneyReciterSelector } from './journey-reciter-selector';
import { ReflectionInput } from './reflection-input';
import { LessonCompleteButton } from './lesson-complete-button';
import { useToast } from '@/hooks/use-toast';
import { useCopy } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';

interface VerseData {
  verse_key: string;
  text_uthmani: string;
  translations?: Array<{
    resource_name: string;
    text: string;
  }>;
}

interface LessonData {
  id: string;
  day_number: number;
  title: string;
  subtitle: string | null;
  topic: string;
  description: string | null;
  verse_keys: string[];
  lesson_text: string | null;
  hadith_text: string | null;
  hadith_source: string | null;
  hadith_collection: string | null;
  hadith_number: number | null;
  reflection_prompt: string | null;
  estimated_minutes: number;
}

interface VerseWithData {
  verse: VerseData | null;
  chapterName: string;
  verseKey: string;
  audioUrl?: string;
}

interface HadithData {
  name: string;
  number: number;
  arabic?: string;
  english: string;
  collection: string;
}

interface JourneyLessonClientProps {
  lesson: LessonData;
  verses: VerseWithData[];
  hadith: HadithData | null;
  initialReflection: string;
  isCompleted: boolean;
  status: string;
  translationId: number;
}

const QURAN_AUDIO_BASE = 'https://verses.quran.foundation';

function resolveAudioUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.replace('cdn.quran.com', 'verses.quran.foundation');
  }
  return `${QURAN_AUDIO_BASE}/${url}`;
}

export function JourneyLessonClient({
  lesson,
  verses,
  hadith,
  initialReflection,
  isCompleted,
  status,
  translationId,
}: JourneyLessonClientProps) {
  const router = useSearchParams();
  const copy = useCopy();
  const { language } = useLanguage();
  const isUrdu = language === 'ur';
  const [currentPlayingVerse, setCurrentPlayingVerse] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [reciterId, setReciterId] = useState<number>(5);
  const [showLibrary, setShowLibrary] = useState(false);
  const toast = useToast();

  const urlTranslation = router.get('translation');
  const currentTranslation = urlTranslation ? parseInt(urlTranslation, 10) : translationId;

  useEffect(() => {
    const stored = localStorage.getItem('sabil-reciter-id');
    if (stored) {
      setReciterId(parseInt(stored, 10));
    }
  }, []);

  const handleReciterChange = (id: number) => {
    setReciterId(id);
    localStorage.setItem('sabil-reciter-id', id.toString());
    toast.success(copy.common.toasts.reciterUpdated);
  };

  const handleLibrarySelect = (id: number) => {
    setShowLibrary(false);
    const params = new URLSearchParams(window.location.search);
    params.set('translation', id.toString());
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    localStorage.setItem('sabil-translation-id', id.toString());
    window.location.reload();
  };

  const libraryCopy = {
    translationLibrary: isUrdu ? 'تراجم کی لائبریری' : 'Translation Library',
    searchPlaceholder: isUrdu ? 'زبان یا مترجم تلاش کریں' : 'Search language or translator',
    recentlyUsed: isUrdu ? 'حالیہ استعمال شدہ' : 'Recently Used',
    recommended: isUrdu ? 'تجویز کردہ' : 'Recommended',
    urduSection: isUrdu ? 'اردو' : 'Urdu',
    englishSection: isUrdu ? 'انگریزی' : 'English',
    otherLanguages: isUrdu ? 'دیگر زبانیں' : 'Other Languages',
    noResults: isUrdu ? 'کوئی ترجمہ نہیں ملا۔' : 'No translations found.',
  };

  const getAudioUrl = useCallback((verseKey: string): string => {
    const chapter = verseKey.split(':')[0];
    const verse = verseKey.split(':')[1];
    return `${QURAN_AUDIO_BASE}/audio-recitation/${reciterId}/${chapter}/${verse}.mp3`;
  }, [reciterId]);

  const playAudio = useCallback((verseKey: string, providedUrl?: string, index: number = 0) => {
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
        toast.error(isUrdu ? 'اس آیت کے لیے آڈیو دستیاب نہیں' : 'Audio not available for this verse');
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
          toast.error(isUrdu ? 'آڈیو چل نہیں سکی' : 'Failed to play audio');
        });

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentPlayingVerse(null);
      };
    }
  }, [audio, currentPlayingVerse, isPlaying, getAudioUrl, toast, verses]);

  const handlePlayAll = useCallback(() => {
    if (!verses.length || verses[0].verse === null) return;

    if (!audio) {
      const newAudio = new Audio();
      setAudio(newAudio);
    }

    const playVerseAtIndex = (index: number) => {
      if (index >= verses.length) {
        setIsPlaying(false);
        setCurrentPlayingVerse(null);
        return;
      }

      const verse = verses[index];
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
  }, [verses, audio]);

  return (
    <div className="px-4 md:px-6 pt-8 md:pt-12 pb-12 max-w-[740px] mx-auto">
      <div className="sticky top-0 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b border-[var(--color-border)] -mx-4 md:-mx-6 px-4 md:px-6 py-4 z-10 -mt-4 md:-mt-12 pt-8 md:pt-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link href="/journey" className="text-[var(--color-primary)] hover:underline text-sm">
            ← {copy.reflections.backToJourney}
          </Link>
          <div className="flex items-center gap-2">
            <JourneyTranslationSelector 
              currentTranslationId={currentTranslation} 
              variant="lesson"
              onOpenLibrary={() => setShowLibrary(true)}
            />
            <JourneyReciterSelector
              currentReciterId={reciterId}
              onReciterChange={handleReciterChange}
            />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-4 mt-4">
            <span className="px-3 py-1 bg-[var(--color-accent)] text-white rounded-full text-sm">
              {copy.common.labels.day} {lesson.day_number}
            </span>
          <span className="flex items-center gap-1 text-sm text-[var(--color-text-muted)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isUrdu ? `~${lesson.estimated_minutes} منٹ` : `~${lesson.estimated_minutes} min`}
          </span>
          {isCompleted && (
            <span className="px-2 py-1 bg-[var(--color-primary)] text-white rounded text-xs">
              {isUrdu ? 'مکمل' : 'Completed'}
            </span>
          )}
        </div>
      </div>

      <div className="mb-8">
        <span className="inline-block px-2.5 py-1 bg-[var(--color-bg)] text-[var(--color-primary)] rounded text-xs mb-3">
          {lesson.topic}
        </span>
        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-text)] mt-2">{lesson.title}</h1>
        {lesson.subtitle && (
          <p className="text-[var(--color-text-muted)] mt-1">{lesson.subtitle}</p>
        )}
        <div className="h-px bg-[var(--color-accent)]/30 mt-6" />
      </div>

        {lesson.description && (
        <div className="mb-8">
          <h2 className="section-heading">{isUrdu ? 'خلاصہ' : 'Overview'}</h2>
          <p className="text-[16px] leading-[1.8] text-[var(--color-text)]">{lesson.description}</p>
        </div>
      )}

      {verses.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-heading mb-0">{isUrdu ? 'قرآنی آیات' : 'Quranic Verses'}</h2>
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
              {isUrdu ? 'سب چلائیں' : 'Play All'}
            </button>
          </div>
          <JourneyVerseSection
            verses={verses}
            reciterId={reciterId}
            onPlayAudio={(verseKey, url, _idx) => playAudio(verseKey, url, 0)}
            currentPlayingVerse={currentPlayingVerse}
            isPlaying={isPlaying}
          />
        </div>
      )}

      {lesson.lesson_text && (
        <div className="mb-8">
          <h2 className="section-heading">{isUrdu ? 'سبق' : 'Lesson'}</h2>
          <div className="prose max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="text-[16px] leading-[1.9] text-[var(--color-text)] mb-5">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic text-[var(--color-text-secondary)]">{children}</em>,
              }}
            >
              {lesson.lesson_text}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {(lesson.hadith_text || hadith) && (
        <div className="mb-8">
          <h2 className="section-heading">{isUrdu ? 'متعلقہ حدیث' : 'Related Hadith'}</h2>
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-4 md:p-6 relative">
            <span className="font-arabic text-[60px] text-[var(--color-accent)] absolute top-2 left-4 opacity-30" dir="rtl">"</span>
            {hadith ? (
              <>
                <div className="flex items-center gap-2 mb-3 mt-2">
                  <span className="text-sm text-[var(--color-primary)]">{hadith.name}</span>
                  <span className="px-2 py-0.5 bg-[var(--color-accent)] text-white rounded text-xs">
                    #{hadith.number}
                  </span>
                </div>
                {hadith.arabic && (
                  <>
                    <p className="font-arabic text-[22px] md:text-[26px] text-right text-[var(--color-text)] leading-[2]" dir="rtl">
                      {hadith.arabic}
                    </p>
                    <div className="h-px bg-[var(--color-border)] my-4" />
                  </>
                )}
                <p className="text-[15px] italic leading-relaxed text-[var(--color-text)]">
                  {hadith.english}
                </p>
              </>
            ) : lesson.hadith_text ? (
              <>
                <p className="font-arabic text-[40px] text-[var(--color-accent)] leading-none mb-2" dir="rtl">"</p>
                <p className="text-[15px] italic leading-relaxed text-[var(--color-text)]">
                  {lesson.hadith_text}
                </p>
                {lesson.hadith_source && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-3 text-right">— {lesson.hadith_source}</p>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {lesson.reflection_prompt && (
        <div className="mb-8">
          <h2 className="section-heading">{copy.journey.lesson.reflectionTitle}</h2>
          <div className="bg-[var(--color-bg)] rounded-xl p-5 border border-[var(--color-primary)]/20">
            <p className="text-[16px] text-[var(--color-text)]">{lesson.reflection_prompt}</p>
          </div>
          <div className="mt-4">
            <ReflectionInput
              lessonId={lesson.id}
              dayNumber={lesson.day_number}
              initialValue={initialReflection || ''}
            />
          </div>
        </div>
      )}

      <div className="mt-8">
        <LessonCompleteButton
          lessonId={lesson.id}
          dayNumber={lesson.day_number}
          isCompleted={isCompleted}
        />
      </div>

      <TranslationLibrarySheet
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        currentTranslationId={currentTranslation}
        onSelect={handleLibrarySelect}
        preferredLanguage={isUrdu ? 'urdu' : 'english'}
        copy={libraryCopy}
      />
    </div>
  );
}
