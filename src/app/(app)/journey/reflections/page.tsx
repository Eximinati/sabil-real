import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import { getPublishedLessons, getUserReflection } from '@/lib/journey';

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

export const dynamic = 'force-dynamic';

export default async function ReflectionsPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const lessons = await getPublishedLessons();
  const reflections = await getReflections(user.id);

  const getLessonTitle = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    return lesson?.title || `Day ${lessonId}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="px-4 md:px-16 pt-8 md:pt-12 pb-12 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/journey" className="text-[var(--color-primary)] hover:underline text-sm">
          ← Back to Journey
        </Link>
        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-text)] mt-4">
          My Reflections
        </h1>
        <p className="text-[var(--color-text-muted)] mt-2">
          Your personal thoughts and insights from each day&apos;s journey.
        </p>
      </div>

      {reflections.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-border)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">No reflections yet</h3>
          <p className="text-[var(--color-text-muted)] mb-6">
            Complete daily lessons to start recording your reflections.
          </p>
          <Link
            href="/journey"
            className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Start Your Journey
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
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5"
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
              <p className="text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                {reflection.reflection_text}
              </p>
              <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <Link
                  href={`/journey/${reflection.day_number}`}
                  className="text-sm text-[var(--color-primary)] hover:underline"
                >
                  View lesson →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}