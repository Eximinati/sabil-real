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
        <p className="text-center text-[#6B7280]">Lesson not available</p>
        <Link href="/journey" className="block text-center text-[#2D6A4F] mt-4">← Back to Journey</Link>
      </div>
    );
  }

  const progress = await getUserProgress(user.id);
  const lessonProgress = progress.find(p => p.lesson_id === lesson.id);
  const status = lessonProgress?.status || 'not_started';

  const preferences = await getUserPreferences(user.id);
  const initialReflection = await getUserReflection(user.id, lesson.id);

  // Fetch chapters for display
  const chaptersRes = await fetch(`${API_BASE}/api/chapters`, { cache: 'no-store' });
  const chaptersData = await chaptersRes.json();
  const chapters = (Array.isArray(chaptersData) ? chaptersData : []) as Chapter[];

  // Fetch verses using by_key endpoint
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

  // Fetch hadith if collection and number exist
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
    <div className="px-6 pt-12 pb-12 max-w-[740px] mx-auto">
      <div className="mb-8">
        <Link href="/journey" className="text-[#2D6A4F] hover:underline">
          ← Back to Journey
        </Link>
        <div className="flex items-center gap-4 mt-4">
          <span className="px-3 py-1 bg-[#B7922A] text-white rounded-full text-sm">
            Day {lesson.day_number}
          </span>
          <span className="text-sm text-[#6B7280]">~{lesson.estimated_minutes} min</span>
        </div>
      </div>

      <div className="mb-8">
        <span className="inline-block px-2 py-1 bg-[#F0F9F4] text-[#2D6A4F] rounded text-xs mb-3">
          {lesson.topic}
        </span>
        <h1 className="text-3xl font-semibold text-[#1A1A1A] mt-2">{lesson.title}</h1>
        {lesson.subtitle && (
          <p className="text-[#6B7280] mt-1">{lesson.subtitle}</p>
        )}
        <div className="h-px bg-[#B7922A]/30 mt-6" />
      </div>

      {lesson.description && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-3">Overview</h2>
          <p className="text-[16px] leading-relaxed text-[#1A1A1A]">{lesson.description}</p>
        </div>
      )}

      {verses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-3">Quranic Verses</h2>
          {verses.map(({ verse, chapterName }, idx) => (
            <div key={idx} className="bg-white border border-[#E8E0D5] rounded-xl p-6 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#B7922A]">
                  {chapterName} · Verse {lesson.verse_keys[idx].split(':')[1]}
                </span>
              </div>
              {verse ? (
                <>
                  <p
                    className="font-arabic text-[26px] text-right text-[#1A1A1A] leading-[2.2]"
                    dir="rtl"
                  >
                    {verse.text_uthmani}
                  </p>
                  <div className="border-t border-[#E8E0D5] pt-4 mt-4">
                    <p className="text-xs text-[#6B7280] mb-1">
                      {verse.translations?.[0]?.resource_name || 'Translation'}
                    </p>
                    <p className="text-[15px] leading-[1.8] text-[#4B5563]">
                      {verse.translations?.[0]?.text || 'No translation available'}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-[#6B7280]">Verse not available</p>
              )}
            </div>
          ))}
        </div>
      )}

      {lesson.lesson_text && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-3">Lesson</h2>
          <div className="prose max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="text-[16px] leading-[1.9] text-[#1A1A1A] mb-4">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic text-[#4B5563]">{children}</em>,
              }}
            >
              {lesson.lesson_text}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {(lesson.hadith_text || hadith) && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-3">Related Hadith</h2>
          <div className="bg-[#F9F6F1] border border-[#E8E0D5] rounded-xl p-6">
            {hadith ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-[#2D6A4F]">{hadith.name}</span>
                  <span className="px-2 py-0.5 bg-[#B7922A] text-white rounded text-xs">
                    #{hadith.number}
                  </span>
                </div>
                {hadith.arabic && (
                  <>
                    <p className="font-arabic text-[26px] text-right text-[#1A1A1A] leading-[2]" dir="rtl">
                      {hadith.arabic}
                    </p>
                    <div className="h-px bg-[#E8E0D5] my-4" />
                  </>
                )}
                <p className="text-[15px] leading-relaxed text-[#1A1A1A]">
                  {hadith.english}
                </p>
              </>
            ) : lesson.hadith_text ? (
              <>
                <p className="font-arabic text-[40px] text-[#B7922A] leading-none mb-2" dir="rtl">"</p>
                <p className="text-[15px] italic leading-relaxed text-[#1A1A1A]">
                  {lesson.hadith_text}
                </p>
                {lesson.hadith_source && (
                  <p className="text-xs text-[#6B7280] mt-3">— {lesson.hadith_source}</p>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {lesson.reflection_prompt && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-3">Reflection</h2>
          <div className="bg-[#F0F9F4] rounded-xl p-5 border border-[#2D6A4F]/20">
            <p className="text-[16px] text-[#1A1A1A]">{lesson.reflection_prompt}</p>
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