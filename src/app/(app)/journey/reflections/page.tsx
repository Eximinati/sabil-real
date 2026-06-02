import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import { getPublishedLessons, getUserReflection } from '@/lib/journey';
import { getServerDictionary } from '@/lib/i18n/server';

interface Reflection {
  lesson_id: string;
  day_number: number;
  reflection_text: string;
  updated_at: string;
}

async function getReflections(userId: string): Promise<Reflection[]> {
  const supabase = await supabaseServer();
  
  const { data: reflections } = await supabase
    .from('user_reflections')
    .select('lesson_id, day_number, reflection_text, updated_at')
    .eq('user_id', userId)
    .not('reflection_text', 'is', null)
    .order('day_number', { ascending: false });

  return reflections || [];
}


export default async function ReflectionsPage() {
  const { dictionary: copy, language } = await getServerDictionary();
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const lessons = await getPublishedLessons(language);
  const reflections = await getReflections(user.id);
  const isUrdu = language === 'ur';

  const getLessonTitle = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    return lesson?.title || `Day ${lessonId}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', {
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="reading-screen px-4 md:px-16 pt-7 md:pt-12 pb-20 md:pb-12 max-w-3xl mx-auto" data-script-direction={isUrdu ? 'rtl' : 'ltr'}>
      <div className="mb-8">
        <Link href="/journey" className="text-[var(--color-primary)] hover:underline text-sm">
          ← {copy.reflections.backToJourney}
        </Link>
          <h1 className={`mt-4 font-semibold text-[var(--color-text)] ${isUrdu ? 'font-urdu text-[30px] leading-[1.9]' : 'text-2xl md:text-3xl'}`}>
            {copy.reflections.title}
          </h1>
          <p className="reading-prose text-[var(--color-text-muted)] mt-2 max-w-2xl">
            {copy.reflections.description}
          </p>
        </div>

      {reflections.length === 0 ? (
        <div className="text-center py-14 md:py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-border)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">{copy.reflections.emptyTitle}</h3>
          <p className="text-[var(--color-text-muted)] mb-6 max-w-md mx-auto leading-[1.9]">
            {copy.reflections.emptyDescription}
          </p>
          <Link
            href="/journey"
            className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            {copy.reflections.openTodayJourney}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {reflections.map((reflection) => (
            <div
              key={reflection.lesson_id}
              className="bg-[var(--color-surface)]/85 border border-[var(--color-border)] rounded-2xl p-5 md:p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded text-xs font-medium">
                    Day {reflection.day_number}
                  </span>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    {getLessonTitle(reflection.lesson_id)}
                  </span>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {formatDate(reflection.updated_at)}
                </span>
              </div>
              <p
                className={`whitespace-pre-wrap text-[var(--color-text-secondary)] ${
                  /[\u0600-\u06FF]/.test(reflection.reflection_text) ? 'font-urdu text-[17px] leading-[2.15]' : 'text-[16px] leading-[1.95]'
                }`}
                dir={/[\u0600-\u06FF]/.test(reflection.reflection_text) ? 'rtl' : 'ltr'}
                data-script-direction={/[\u0600-\u06FF]/.test(reflection.reflection_text) ? 'rtl' : 'ltr'}
              >
                {reflection.reflection_text}
              </p>
              <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <Link
                  href={`/journey/${reflection.day_number}`}
                  className="text-sm text-[var(--color-primary)] hover:underline"
                >
                  {copy.reflections.viewLesson} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
