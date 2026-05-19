'use client';

import { useState, useEffect } from 'react';

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

interface HadithContentInnerProps {
  lesson: LessonData;
}

export function HadithContentInner({ lesson }: HadithContentInnerProps) {
  const [hadith, setHadith] = useState<HadithData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lesson.hadith_collection || !lesson.hadith_number) return;
    
    setLoading(true);
    async function fetchHadith() {
      try {
        const res = await fetch(`/api/hadith?collection=${lesson.hadith_collection}&number=${lesson.hadith_number}`);
        if (!res.ok) throw new Error('Failed to fetch hadith');
        const data = await res.json();
        setHadith(data.hadith || null);
      } catch (err) {
        setHadith(null);
      } finally {
        setLoading(false);
      }
    }
    fetchHadith();
  }, [lesson.hadith_collection, lesson.hadith_number]);

  if (!lesson.hadith_text && !lesson.hadith_collection) return null;
  if (!lesson.hadith_text && !hadith) return null;

  if (loading) {
    return (
      <div className="mb-8 animate-pulse">
        <div className="w-32 h-6 bg-[var(--color-border)] rounded mb-4" />
        <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-4 md:p-6">
          <div className="w-32 h-5 bg-[var(--color-border)] rounded mb-3" />
          <div className="w-full h-6 bg-[var(--color-border)] rounded mb-2" />
          <div className="h-px w-full my-4 bg-[var(--color-border)]" />
          <div className="w-full h-4 bg-[var(--color-border)] rounded mb-2" />
          <div className="w-4/5 h-4 bg-[var(--color-border)] rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="section-heading">Related Hadith</h2>
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
  );
}