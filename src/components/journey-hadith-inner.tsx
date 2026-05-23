'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-url';

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
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    setFetchKey(k => k + 1);
  }, [lesson.hadith_collection, lesson.hadith_number]);

  useEffect(() => {
    if (fetchKey === 0) return;
    if (!lesson.hadith_collection || !lesson.hadith_number) return;
    
    setLoading(true);
    let cancelled = false;
    
    async function fetchHadith() {
      try {
        const res = await fetch(getApiUrl(`/hadith?collection=${lesson.hadith_collection}&number=${lesson.hadith_number}`));
        if (!res.ok) throw new Error('Failed to fetch hadith');
        const data = await res.json();
        if (!cancelled) {
          setHadith(data.hadith || null);
        }
      } catch (err) {
        if (!cancelled) setHadith(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    
    fetchHadith();
    return () => { cancelled = true; };
  }, [fetchKey]);

  if (!lesson.hadith_text && !lesson.hadith_collection) return null;

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

  if (!hadith && lesson.hadith_text) {
    return (
      <div className="mb-10">
        <h2 className="section-heading">A Prophetic reminder</h2>
        <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-4 md:p-6 relative">
          <span className="font-arabic text-[60px] text-[var(--color-accent)] absolute top-2 left-4 opacity-30" dir="rtl">"</span>
          <p className="font-arabic text-[40px] text-[var(--color-accent)] leading-none mb-2" dir="rtl">"</p>
          <p className="text-[15px] italic leading-relaxed text-[var(--color-text)]">
            {lesson.hadith_text}
          </p>
          {lesson.hadith_source && (
            <p className="text-xs text-[var(--color-text-muted)] mt-3 text-right">— {lesson.hadith_source}</p>
          )}
        </div>
      </div>
    );
  }

  if (!hadith) {
    return (
      <div className="mb-10">
        <h2 className="section-heading">A Prophetic reminder</h2>
        <div className="bg-[var(--color-bg)] border border-[var(--color-error)]/30 rounded-xl p-6 text-center">
          <svg className="w-8 h-8 mx-auto text-[var(--color-error)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-[var(--color-text)] font-medium text-sm mb-1">Hadith unavailable</p>
          <p className="text-xs text-[var(--color-text-muted)]">Could not load hadith content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10">
      <h2 className="section-heading">A Prophetic reminder</h2>
      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-5 md:p-6 relative">
        <span className="font-arabic text-[60px] text-[var(--color-accent)] absolute top-2 left-4 opacity-30" dir="rtl">"</span>
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
      </div>
    </div>
  );
}
