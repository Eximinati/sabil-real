'use client';

import { useState, useEffect } from 'react';
import { useCopy } from '@/hooks/use-copy';

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

interface ReflectionContentInnerProps {
  lesson: LessonData;
  initialReflection: string;
}

export function ReflectionContentInner({ lesson, initialReflection }: ReflectionContentInnerProps) {
  const [ReflectionInput, setReflectionInput] = useState<any>(null);
  const [mountKey, setMountKey] = useState(0);
  const copy = useCopy();

  useEffect(() => {
    setMountKey(k => k + 1);
  }, [lesson.id]);

  useEffect(() => {
    if (mountKey === 0) return;
    import('./reflection-input').then((mod) => {
      setReflectionInput(() => mod.ReflectionInput);
    });
  }, [mountKey]);

  if (!lesson.reflection_prompt) return null;

  const isUrduPrompt = /[\u0600-\u06FF]/.test(lesson.reflection_prompt);

  if (!ReflectionInput) {
    return (
      <div className="mb-8 animate-pulse">
        <div className="w-28 h-6 bg-[var(--color-border)] rounded mb-4" />
        <div className="bg-[var(--color-bg)] rounded-xl p-5 border border-[var(--color-primary)]/20">
          <div className="w-full h-4 bg-[var(--color-border)] rounded mb-2" />
          <div className="w-2/3 h-4 bg-[var(--color-border)] rounded" />
        </div>
        <div className="w-full h-24 bg-[var(--color-border)] rounded-lg mt-4" />
      </div>
    );
  }

  return (
    <div className="reading-section">
      <h2 className="section-heading">{copy.journey.lesson.reflectionTitle}</h2>
      <div className="reflection-prompt-card">
        <p
          className={`text-[var(--color-text)] ${isUrduPrompt ? 'reading-prose-urdu' : 'reading-prose'} `}
          dir={isUrduPrompt ? 'rtl' : 'ltr'}
          data-script-direction={isUrduPrompt ? 'rtl' : 'ltr'}
        >
          {lesson.reflection_prompt}
        </p>
      </div>
      <div className="mt-6 md:mt-7">
        <ReflectionInput
          lessonId={lesson.id}
          dayNumber={lesson.day_number}
          initialValue={initialReflection || ''}
        />
      </div>
    </div>
  );
}
