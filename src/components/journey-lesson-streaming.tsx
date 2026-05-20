'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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

interface LessonBlock {
  id: string;
  lesson_id: string;
  order_index: number;
  block_type: string;
  content: Record<string, unknown>;
}

interface StreamingLessonClientProps {
  lesson: LessonData;
  blocks?: LessonBlock[];
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
    if (id === selectedTranslation) return;
    
    setSelectedTranslation(id);
    localStorage.setItem('sabil-translation-id', id.toString());
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('translation', id.toString());
    
    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
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
  blocks,
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

      {blocks && blocks.length > 0 && (
        <BlockContent blocks={blocks} translationId={translationId} />
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

interface VerseWithData {
  verse_key: string;
  text_uthmani: string;
  chapter_name?: string;
  translations?: Array<{ resource_name: string; text: string }>;
  audio_url?: string;
}

function BlockContent({ blocks, translationId }: { blocks?: LessonBlock[]; translationId: number }) {
  const [verseDataMap, setVerseDataMap] = useState<Record<string, VerseWithData>>({});
  const [loadingVerses, setLoadingVerses] = useState(false);

  useEffect(() => {
    const verseBlocks = blocks?.filter(b => b.block_type === 'verse') || [];
    if (verseBlocks.length === 0) return;

    setLoadingVerses(true);
    
    const fetchVerses = async () => {
      const verseKeys = verseBlocks.map(b => b.content.verse_key as string).filter(Boolean);
      if (verseKeys.length === 0) return;

      try {
        const response = await fetch(`/api/verses?verse_keys=${verseKeys.join(',')}&translation=${translationId}`);
        if (response.ok) {
          const data = await response.json();
          const map: Record<string, VerseWithData> = {};
          (data.verses || []).forEach((v: { verse: VerseWithData; verseKey: string; chapterName?: string; audioUrl?: string }) => {
            if (v.verse) {
              map[v.verseKey] = {
                ...v.verse,
                chapter_name: v.chapterName,
                audio_url: v.audioUrl,
              };
            }
          });
          setVerseDataMap(map);
        }
      } catch (error) {
        console.error('Failed to fetch verses:', error);
      } finally {
        setLoadingVerses(false);
      }
    };

    fetchVerses();
  }, [blocks, translationId]);

  if (!blocks || blocks.length === 0) return null;
  
  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        const content = block.content as Record<string, unknown>;
        
        switch (block.block_type) {
          case 'heading':
            const level = content.level as number || 2;
            const HeadingTag = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
            const headingClass = level === 1 ? 'text-2xl font-bold text-[var(--color-text)] mt-8 mb-4' 
              : level === 2 ? 'text-xl font-semibold text-[var(--color-text)] mt-6 mb-3' 
              : 'text-lg font-medium text-[var(--color-text)] mt-5 mb-2';
            return <HeadingTag key={index} className={headingClass}>{content.text as string}</HeadingTag>;
            
          case 'paragraph':
            const text = content.text as string || '';
            const withBold = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            const withItalic = withBold.replace(/\*([^*]+)\*/g, '<em>$1</em>');
            return (
              <p key={index} className="text-[16px] leading-[1.9] text-[var(--color-text)]" 
                dangerouslySetInnerHTML={{ __html: withItalic }}
              />
            );
            
          case 'arabic':
            return (
              <p key={index} className="font-arabic text-[24px] md:text-[28px] text-right text-[var(--color-text)] leading-[2] my-4" dir="rtl">
                {content.text as string}
              </p>
            );
            
          case 'transliteration':
            const transText = content.text as string | undefined;
            const transTranslation = content.translation as string | undefined;
            return (
              <div key={index} className="my-4 bg-[var(--color-bg)] rounded-lg p-4 border border-[var(--color-border)]">
                {transText && (
                  <p className="text-[16px] italic text-[var(--color-text)] leading-relaxed mb-3">
                    {transText}
                  </p>
                )}
                {transTranslation && (
                  <>
                    <div className="h-px bg-[var(--color-border)] my-3" />
                    <p className="text-[14px] text-[var(--color-text-muted)]">{transTranslation}</p>
                  </>
                )}
              </div>
            );
            
          case 'verse':
            const verseKey = content.verse_key as string | undefined;
            const verseData = verseKey ? verseDataMap[verseKey] : null;
            
            return (
              <div key={index} className="my-4 p-4 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-lg">
                {verseKey && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[var(--color-primary)] text-sm">✦</span>
                    <span className="text-sm font-medium text-[var(--color-primary)]">
                      {verseData?.chapter_name || 'Quran'} {verseKey}
                    </span>
                  </div>
                )}
                
                {verseData?.text_uthmani && (
                  <p className="font-arabic text-[20px] text-right text-[var(--color-text)] my-3 leading-[2]" dir="rtl">
                    {verseData.text_uthmani}
                  </p>
                )}
                
                {verseData?.translations?.length ? (
                  <p className="text-[14px] text-[var(--color-text-muted)] mt-2 leading-relaxed">
                    {verseData.translations[0].text}
                  </p>
                ) : loadingVerses ? (
                  <p className="text-[12px] text-[var(--color-text-muted)] mt-2">Loading translation...</p>
                ) : null}
              </div>
            );
            
          case 'quote':
            const quoteText = content.text as string | undefined;
            const quoteSource = content.source as string | undefined;
            return (
              <div key={index} className="my-4 relative">
                <span className="font-arabic text-[48px] text-[var(--color-accent)] absolute top-0 left-0 opacity-30" dir="rtl">"</span>
                <blockquote className="pl-8 pr-4 py-2">
                  {quoteText && (
                    <p className="text-[15px] italic leading-relaxed text-[var(--color-text)]">
                      {quoteText}
                    </p>
                  )}
                  {quoteSource && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-2 text-right">
                      — {quoteSource}
                    </p>
                  )}
                </blockquote>
              </div>
            );
            
          case 'reflection':
            const prompts = content.prompts as string[] | undefined;
            if (!prompts || prompts.length === 0) return null;
            return (
              <div key={index} className="my-8 p-6 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-bg)] rounded-2xl border-2 border-[var(--color-accent)]/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-accent)]">Pause & Reflect</h3>
                </div>
                <div className="space-y-3">
                  {prompts.filter(Boolean).map((prompt, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                      <span className="w-6 h-6 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium text-sm flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-[15px] text-[var(--color-text)] leading-relaxed">{prompt}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
            
          case 'list':
            const listItems = content.items as string[] | undefined;
            if (!listItems || listItems.length === 0) return null;
            return (
              <ul key={index} className="my-4 space-y-2">
                {listItems.filter(Boolean).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[15px] text-[var(--color-text)]">
                    <span className="text-[var(--color-accent)] mt-1">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            );
            
          default:
            return null;
        }
      })}
    </div>
  );
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