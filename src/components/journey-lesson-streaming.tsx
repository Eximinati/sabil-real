'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  LessonHeaderSkeleton, 
  VerseSectionSkeleton, 
  HadithSectionSkeleton,
  LessonTextSkeleton,
  ReflectionSectionSkeleton,
  CompleteButtonSkeleton,
  TafsirSectionSkeleton
} from './journey-lesson-skeleton';
import { JourneyTafsirStreaming } from './journey-tafsir-streaming';
import { JourneyTranslationSelector } from './journey-translation-selector';
import { JourneyReciterSelector } from './journey-reciter-selector';
import { useToast } from '@/hooks/use-toast';
import { useFocusMode } from './focus-mode-provider';
import { AudioPlayer } from './audio-player';

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

interface StreamingLessonClientProps {
  lesson: LessonData;
  initialReflection: string;
  isCompleted: boolean;
  status: string;
  translationId: number;
  tafsirId?: number;
  urlTranslation?: string | null;
}

function StreamSectionLogger({ name, children }: { name: string; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Stream] ${name} resolved`);
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [name]);
  
  return <>{children}</>;
}

function JourneyLessonHeader({ 
  lesson, 
  translationId,
  urlTranslation,
  isCompleted
}: { 
  lesson: LessonData; 
  translationId: number;
  urlTranslation?: string | null;
  isCompleted?: boolean;
}) {
  const toast = useToast();
  const { isFocusMode } = useFocusMode();
  const [selectedTranslation, setSelectedTranslation] = useState(
    urlTranslation ? parseInt(urlTranslation, 10) : translationId
  );
  const [selectedReciter, setSelectedReciter] = useState(5);

  useEffect(() => {
    const storedReciter = localStorage.getItem('sabil-reciter-id');
    if (storedReciter) {
      setSelectedReciter(parseInt(storedReciter, 10));
    }
  }, []);

  useEffect(() => {
    if (urlTranslation) {
      setSelectedTranslation(parseInt(urlTranslation, 10));
    }
  }, [urlTranslation]);

  const handleTranslationChange = (id: number) => {
    setSelectedTranslation(id);
    localStorage.setItem('sabil-translation-id', id.toString());
    const newUrl = `${window.location.pathname}?translation=${id}`;
    window.location.href = newUrl;
  };

  const handleReciterChange = (id: number) => {
    setSelectedReciter(id);
    localStorage.setItem('sabil-reciter-id', id.toString());
    toast.success('Reciter updated');
  };

  const FocusModeToggle = useMemo(() => require('./focus-mode-toggle').FocusModeToggle, []);

  return (
    <div className="sticky top-0 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b border-[var(--color-border)] -mx-4 md:-mx-6 px-4 md:px-6 py-4 z-10 -mt-4 md:-mt-12 pt-8 md:pt-16 mb-6">
      <div className="flex items-center justify-between gap-4 max-w-[740px] mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/journey" className="text-[var(--color-primary)] hover:underline text-sm">
            ← Back to Journey
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <JourneyTranslationSelector 
            currentTranslationId={selectedTranslation}
            onTranslationChange={handleTranslationChange}
          />
          <JourneyReciterSelector
            currentReciterId={selectedReciter}
            onReciterChange={handleReciterChange}
          />
          <FocusModeToggle />
        </div>
      </div>
    </div>
  );
}

export function StreamingLessonShell({ 
  lesson, 
  initialReflection, 
  isCompleted, 
  status, 
  translationId,
  tafsirId,
  urlTranslation
}: StreamingLessonClientProps) {
  const { isFocusMode } = useFocusMode();

  const containerClass = isFocusMode ? 'max-w-[850px] mx-auto' : 'max-w-[740px] mx-auto';

  return (
    <div className={`px-4 md:px-6 pt-8 md:pt-12 pb-12 ${containerClass}`}>
      <JourneyLessonHeader 
        lesson={lesson} 
        translationId={translationId}
        urlTranslation={urlTranslation}
        isCompleted={isCompleted}
      />

      <div className="mb-6 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl text-center text-sm text-amber-800 dark:text-amber-200">
        <span className="font-medium">Development &amp; Submission Notice:</span> This journey content is for demo purposes only. We are still refining it.
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-4 mt-4">
          <span className="px-3 py-1 bg-[var(--color-accent)] text-white rounded-full text-sm">
            Day {lesson.day_number}
          </span>
          <span className="flex items-center gap-1 text-sm text-[var(--color-text-muted)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ~{lesson.estimated_minutes} min
          </span>
          {isCompleted && (
            <span className="px-2 py-1 bg-[var(--color-primary)] text-white rounded text-xs">
              Completed
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
          <h2 className="section-heading">Overview</h2>
          <p className="text-[16px] leading-[1.8] text-[var(--color-text)]">{lesson.description}</p>
        </div>
      )}

      <Suspense fallback={<VerseSectionSkeleton />}>
        <StreamSectionLogger name="VerseContent">
          <VerseContent 
            verseKeys={lesson.verse_keys} 
            translationId={translationId}
            lessonId={lesson.id}
          />
        </StreamSectionLogger>
      </Suspense>

      {tafsirId && lesson.verse_keys.length > 0 && (
        <Suspense fallback={<TafsirSectionSkeleton />}>
          <StreamSectionLogger name="TafsirContent">
            <JourneyTafsirStreaming 
              verseKeys={lesson.verse_keys}
              tafsirId={tafsirId}
            />
          </StreamSectionLogger>
        </Suspense>
      )}

      {lesson.lesson_text && (
        <LessonTextContent lessonText={lesson.lesson_text} />
      )}

      <Suspense fallback={<HadithSectionSkeleton />}>
        <StreamSectionLogger name="HadithContent">
          <HadithContent 
            lesson={lesson}
          />
        </StreamSectionLogger>
      </Suspense>

      <Suspense fallback={<ReflectionSectionSkeleton />}>
        <StreamSectionLogger name="ReflectionContent">
          <ReflectionContent 
            lesson={lesson}
            initialReflection={initialReflection}
          />
        </StreamSectionLogger>
      </Suspense>

      <Suspense fallback={<CompleteButtonSkeleton />}>
        <StreamSectionLogger name="CompleteButton">
          <CompleteButton 
            lessonId={lesson.id}
            dayNumber={lesson.day_number}
            isCompleted={isCompleted}
          />
        </StreamSectionLogger>
      </Suspense>

      <AudioPlayer />
    </div>
  );
}

function VerseContent({ verseKeys, translationId, lessonId }: { verseKeys: string[]; translationId: number; lessonId: string }) {
  const { JourneyVerseContentInner } = require('./journey-verse-content-inner');
  return <JourneyVerseContentInner verseKeys={verseKeys} translationId={translationId} lessonId={lessonId} />;
}

function LessonTextContent({ lessonText }: { lessonText: string | null }) {
  if (!lessonText) return null;
  
  const { LessonTextInner } = require('./journey-lesson-text-inner');
  return <LessonTextInner lessonText={lessonText} />;
}

function HadithContent({ lesson }: { lesson: LessonData }) {
  const { HadithContentInner } = require('./journey-hadith-inner');
  return <HadithContentInner lesson={lesson} />;
}

function ReflectionContent({ lesson, initialReflection }: { lesson: LessonData; initialReflection: string }) {
  const { ReflectionContentInner } = require('./journey-reflection-inner');
  return <ReflectionContentInner lesson={lesson} initialReflection={initialReflection} />;
}

function CompleteButton({ lessonId, dayNumber, isCompleted }: { lessonId: string; dayNumber: number; isCompleted: boolean }) {
  const { LessonCompleteButton } = require('./lesson-complete-button');
  return <LessonCompleteButton lessonId={lessonId} dayNumber={dayNumber} isCompleted={isCompleted} />;
}