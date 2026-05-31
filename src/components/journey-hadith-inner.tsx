'use client';

import { useState, useEffect } from 'react';
import { fetchHadith } from '@/lib/hadith-cache';
import { useCopy } from '@/hooks/use-copy';
import { useLanguage } from '@/lib/i18n/context';

interface HadithData {
  name: string;
  number: number;
  arabic?: string;
  english?: string | null;
  urdu?: string | null;
  grades?: Array<{ name: string; grade: string }>;
  available_languages?: string[];
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
  preferredLanguage?: 'auto' | 'english' | 'urdu';
  title?: string;
}

export function HadithContentInner({
  lesson,
  preferredLanguage = 'auto',
  title,
}: HadithContentInnerProps) {
  const [hadith, setHadith] = useState<HadithData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const copy = useCopy();
  const { language } = useLanguage();
  const selectedLanguage: 'english' | 'urdu' =
    preferredLanguage === 'english' || preferredLanguage === 'urdu'
      ? preferredLanguage
      : language === 'ur'
        ? 'urdu'
        : 'english';

  useEffect(() => {
    setFetchKey(k => k + 1);
  }, [lesson.hadith_collection, lesson.hadith_number, selectedLanguage]);

  useEffect(() => {
    if (fetchKey === 0) return;
    if (!lesson.hadith_collection || !lesson.hadith_number) return;
    
    setLoading(true);
    let cancelled = false;
    
    async function fetchHadithData() {
      try {
        const col = lesson.hadith_collection;
        const num = lesson.hadith_number;
        if (!col || !num) return;
        const data = await fetchHadith(col, num);
        if (!cancelled) {
          setHadith(data?.hadith || null);
        }
      } catch (err) {
        if (!cancelled) setHadith(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHadithData();
    return () => { cancelled = true; };
  }, [fetchKey]);

  if (!lesson.hadith_text && !lesson.hadith_collection) return null;

  const isUrduFallbackHadith = /[\u0600-\u06FF]/.test(lesson.hadith_text || '');
  const preferUrdu = selectedLanguage === 'urdu';
  const resolvedHadithText = preferUrdu
    ? hadith?.urdu || hadith?.english || ''
    : hadith?.english || hadith?.urdu || '';
  const resolvedHadithLanguage = preferUrdu
    ? (hadith?.urdu ? 'urdu' : hadith?.english ? 'english' : null)
    : (hadith?.english ? 'english' : hadith?.urdu ? 'urdu' : null);

  const frameCopy = language === 'ur'
    ? {
        sourceLabel: 'اصل روایت',
        sourceHint: 'یہ ماخذ کا متن ہے۔',
        translationLabel: 'فہم کے لیے ترجمہ',
        translationHint: 'یہ حصہ معنی واضح کرنے کے لیے ہے۔',
        languageFallback: 'منتخب زبان دستیاب نہیں تھی، اس لیے دستیاب ترجمہ دکھایا گیا ہے۔',
      }
    : {
        sourceLabel: 'Source narration',
        sourceHint: 'Read as transmitted source text.',
        translationLabel: 'Meaning translation',
        translationHint: 'This supports understanding and is not source wording.',
        languageFallback: 'Selected language unavailable, so the available translation is shown.',
      };

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
        <h2 className="section-heading">{title || copy.journey.lesson.hadithTitle}</h2>
        <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-4 md:p-6 relative">
          <span className="font-arabic text-[60px] text-[var(--color-accent)] absolute top-2 left-4 opacity-30" dir="rtl">"</span>
          <p className="font-arabic text-[40px] text-[var(--color-accent)] leading-none mb-2" dir="rtl">"</p>
          <p
            className={`italic text-[var(--color-text)] ${isUrduFallbackHadith ? 'font-urdu text-[17px] leading-[2.15]' : 'text-[15px] leading-relaxed'}`}
            dir={isUrduFallbackHadith ? 'rtl' : 'ltr'}
          >
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
        <h2 className="section-heading">{title || copy.journey.lesson.hadithTitle}</h2>
        <div className="bg-[var(--color-bg)] border border-[var(--color-error)]/30 rounded-xl p-6 text-center">
          <svg className="w-8 h-8 mx-auto text-[var(--color-error)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-[var(--color-text)] font-medium text-sm mb-1">{copy.journey.lesson.hadithUnavailableTitle}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{copy.journey.lesson.hadithUnavailableDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10">
      <h2 className="section-heading">{title || copy.journey.lesson.hadithTitle}</h2>
      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-5 md:p-6 relative">
        <span className="font-arabic text-[60px] text-[var(--color-accent)] absolute top-2 left-4 opacity-30" dir="rtl">"</span>
        <div className="flex items-center gap-2 mb-3 mt-2">
          <span className="text-sm text-[var(--color-primary)]">{hadith.name}</span>
          <span className="px-2 py-0.5 bg-[var(--color-accent)] text-white rounded text-xs">
            #{hadith.number}
          </span>
        </div>
        {hadith.grades && hadith.grades.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {hadith.grades.map((g, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  g.grade.toLowerCase().includes('sahih')
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : g.grade.toLowerCase().includes('daif') || g.grade.toLowerCase().includes('weak')
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                }`}
              >
                {g.name ? `${g.name}: ${g.grade}` : g.grade}
              </span>
            ))}
          </div>
        )}
        {hadith.arabic && (
          <div className="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/55 p-4">
            <p className="text-xs font-medium text-[var(--color-primary)]">{frameCopy.sourceLabel}</p>
            <p className="text-[11px] text-[var(--color-text-muted)] mb-2">{frameCopy.sourceHint}</p>
            <p className="font-arabic text-[22px] md:text-[26px] text-right text-[var(--color-text)] leading-[2]" dir="rtl">
              {hadith.arabic}
            </p>
          </div>
        )}

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/45 p-4">
          <p className="text-xs font-medium text-[var(--color-primary)]">{frameCopy.translationLabel}</p>
          <p className="text-[11px] text-[var(--color-text-muted)] mb-2">{frameCopy.translationHint}</p>
          {resolvedHadithLanguage && resolvedHadithLanguage !== (preferUrdu ? 'urdu' : 'english') && (
            <p className="mb-2 text-xs text-[var(--color-text-muted)]">{frameCopy.languageFallback}</p>
          )}
          <p
            className={`leading-relaxed text-[var(--color-text)] ${
              resolvedHadithLanguage === 'urdu' ? 'font-urdu text-[17px] leading-[2.1]' : 'text-[15px] italic'
            }`}
            dir={resolvedHadithLanguage === 'urdu' ? 'rtl' : 'ltr'}
          >
            {resolvedHadithText}
          </p>
        </div>
      </div>
    </div>
  );
}
