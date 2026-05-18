import { redirect } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { supabaseServer } from '@/lib/supabase-server';
import { getLessonByDay, getUserProgress, getUserReflection, getUserPreferences } from '@/lib/journey';
import { ReflectionInput } from '@/components/reflection-input';
import { LessonCompleteButton } from '@/components/lesson-complete-button';

interface PageProps {
  params: Promise<{ day: string }>;
}

const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';

interface Verse {
  id: number;
  verse_key: string;
  text_uthmani: string;
  translations: Array<{
    text: string;
    resource_id: number;
    resource_name: string;
  }>;
}

interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
}

interface HadithData {
  number: number;
  arabic: string;
  english: string;
  collection: string;
  name: string;
}

export const dynamic = 'force-dynamic';

export default async function LessonPage({ params }: PageProps) {
  const { day } = await params;
  const dayNumber = parseInt(day, 10);

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const lesson = await getLessonByDay(dayNumber);
  if (!lesson) {
    return (
      <div className="px-6 pt-12 pb-12 max-w-[740px] mx-auto">
        <p className="text-center text-[var(--color-text-muted)]">Lesson not available</p>
        <Link href="/journey" className="block text-center text-[var(--color-primary)] mt-4 hover:underline">← Back to Journey</Link>
      </div>
    );
  }

  const progress = await getUserProgress(user.id);
  const lessonProgress = progress.find(p => p.lesson_id === lesson.id);
  const status = lessonProgress?.status || 'not_started';

  const preferences = await getUserPreferences(user.id);
  const initialReflection = await getUserReflection(user.id, lesson.id);

  const chaptersRes = await fetch(`${API_BASE}/api/chapters`, { cache: 'no-store' });
  const chaptersData = await chaptersRes.json();
  const chapters = (Array.isArray(chaptersData) ? chaptersData : []) as Chapter[];

  const verses: Array<{ verse: Verse | null; chapterName: string }> = [];
  
  for (const verseKey of lesson.verse_keys) {
    const [chapterId] = verseKey.split(':');
    try {
      const verseRes = await fetch(
        `${API_BASE}/api/verses/by_key/${verseKey}?translation=${preferences.translation_id}`,
        { cache: 'no-store' }
      );
      const verseData = await verseRes.json();
      const chapter = chapters.find(c => c.id === parseInt(chapterId));
      const verse = verseData?.verse || null;
      verses.push({ verse, chapterName: chapter?.name_simple || `Chapter ${chapterId}` });
    } catch (e) {
      verses.push({ verse: null, chapterName: `Chapter ${chapterId}` });
    }
  }

  let hadith: HadithData | null = null;
  if (lesson.hadith_collection && lesson.hadith_number) {
    try {
      const hadithRes = await fetch(
        `${API_BASE}/api/hadith/${lesson.hadith_collection}/${lesson.hadith_number}`
      );
      const hadithData = await hadithRes.json();
      hadith = hadithData?.hadith || null;
    } catch (e) {
      // Ignore hadith fetch errors
    }
  }

  return (
    <div className="px-4 md:px-6 pt-8 md:pt-12 pb-12 max-w-[740px] mx-auto">
      <div className="sticky top-0 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b border-[var(--color-border)] -mx-4 md:-mx-6 px-4 md:px-6 py-4 z-10 -mt-4 md:-mt-12 pt-8 md:pt-16">
        <Link href="/journey" className="text-[var(--color-primary)] hover:underline text-sm">
          ← Back to Journey
        </Link>
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

      {verses.length > 0 && (
        <div className="mb-8">
          <h2 className="section-heading">Quranic Verses</h2>
          {verses.map(({ verse, chapterName }, idx) => (
            <div key={idx} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 md:p-6 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[var(--color-accent)]">
                  {chapterName} · Verse {lesson.verse_keys[idx].split(':')[1]}
                </span>
              </div>
              {verse ? (
                <>
                  <p
                    className="font-arabic text-[22px] md:text-[28px] text-right text-[var(--color-text)] leading-[2.4]"
                    dir="rtl"
                  >
                    {verse.text_uthmani}
                  </p>
                  <div className="border-t border-[var(--color-border)] pt-4 mt-4">
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">
                      {verse.translations?.[0]?.resource_name || 'Translation'}
                    </p>
                    <p className="text-[14px] md:text-[15px] leading-[1.8] text-[var(--color-text-secondary)]">
                      {verse.translations?.[0]?.text || 'No translation available'}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-[var(--color-text-muted)]">Verse not available</p>
              )}
            </div>
          ))}
        </div>
      )}

      {lesson.lesson_text && (
        <div className="mb-8">
          <h2 className="section-heading">Lesson</h2>
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
      )}

      {lesson.reflection_prompt && (
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
      )}

      <div className="mt-8">
        <LessonCompleteButton
          lessonId={lesson.id}
          dayNumber={lesson.day_number}
          isCompleted={status === 'completed'}
        />
      </div>
    </div>
  );
}