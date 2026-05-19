'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    import('./reflection-input').then((mod) => {
      setReflectionInput(() => mod.ReflectionInput);
    });
  }, []);

  if (!lesson.reflection_prompt) return null;

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
    <div className="mb-8">
      <h2 className="section-heading">Reflection</h2>
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
  );
}