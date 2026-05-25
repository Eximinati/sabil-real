import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { getLatestDayNumber } from '@/lib/admin-journey-actions';
import { LessonEditor } from '@/components/admin/lesson-editor';
import { EMOTIONAL_QA_CHECKLIST } from '@/lib/journey-day-template';

export default async function NewLessonPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  
  const isAdmin = adminEmails.length > 0 
    ? adminEmails.includes(user.email?.toLowerCase() || '')
    : user.email?.endsWith('@quran.foundation');

  if (!isAdmin) {
    redirect('/journey');
  }

  const nextDayNumber = await getLatestDayNumber();

  return (
    <div>
      <div className="mb-6">
        <a href="/admin/journey" className="text-sm text-[var(--color-primary)] hover:underline">
          ← Back to Lessons
        </a>
      </div>
      <LessonEditor 
        initialData={{
          metadata: {
            day_number: nextDayNumber,
            title: '',
            subtitle: '',
            topic: '',
            description: '',
            estimated_minutes: 15,
            is_published: false,
            emotional_qa: Object.fromEntries(EMOTIONAL_QA_CHECKLIST.map((item) => [item.id, false])),
            translation_status: {
              en: 'qa_approved',
              ur: 'untranslated',
            },
            localized_content: {},
            shared_metadata: {
              lesson_order: nextDayNumber,
              content_version: 1,
              qa_status: {},
              editorial: {
                workflow_version: 1,
                canonical_source_language: 'en',
                cross_language_checks: {},
                publishing_safety_checks: {},
                language_states: {
                  en: {
                    stage: 'qa_approved',
                  },
                  ur: {
                    stage: 'untranslated',
                  },
                },
                drift_flags: [],
              },
            },
          },
          blocks: [],
        }}
        userId={user.id}
      />
    </div>
  );
}
