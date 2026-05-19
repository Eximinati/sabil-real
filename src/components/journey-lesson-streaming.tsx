'use client';

import { Suspense, useEffect, useState } from 'react';
import { 
  LessonHeaderSkeleton, 
  VerseSectionSkeleton, 
  HadithSectionSkeleton,
  LessonTextSkeleton,
  ReflectionSectionSkeleton,
  CompleteButtonSkeleton,
  TafsirSectionSkeleton
} from './journey-lesson-skeleton';

interface VerseWithData {
  verse: { verse_key: string; text_uthmani: string; translations?: Array<{ resource_name: string; text: string }> } | null;
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

import { JourneyTafsirStreaming } from './journey-tafsir-streaming';

interface StreamingLessonClientProps {
  lesson: LessonData;
  initialReflection: string;
  isCompleted: boolean;
  status: string;
  translationId: number;
  tafsirId?: number;
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

export function StreamingLessonShell({ 
  lesson, 
  initialReflection, 
  isCompleted, 
  status, 
  translationId,
  tafsirId
}: StreamingLessonClientProps) {
  return (
    <div className="px-4 md:px-6 pt-8 md:pt-12 pb-12 max-w-[740px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-4 mt-4">
          <div className="px-3 py-1 bg-[var(--color-accent)] text-white rounded-full text-sm">
            Day {lesson.day_number}
          </div>
          <div className="flex items-center gap-1 text-sm text-[var(--color-text-muted)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ~{lesson.estimated_minutes} min
          </div>
          {isCompleted && (
            <div className="px-2 py-1 bg-[var(--color-primary)] text-white rounded text-xs">
              Completed
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <div className="inline-block px-2.5 py-1 bg-[var(--color-bg)] text-[var(--color-primary)] rounded text-xs mb-3">
          {lesson.topic}
        </div>
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

function ShimmerStyles() {
  return (
    <style>{`
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `}</style>
  );
}