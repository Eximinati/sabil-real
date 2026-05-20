import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { getLatestDayNumber } from '@/lib/admin-journey-actions';
import { LessonEditor } from '@/components/admin/lesson-editor';

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
          },
          blocks: [],
        }}
        userId={user.id}
      />
    </div>
  );
}