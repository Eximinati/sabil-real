import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';

interface LessonRow {
  id: string;
  day_number: number;
  title: string;
  topic: string;
  is_published: boolean;
  created_at: string;
}

async function getLessons(): Promise<LessonRow[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('journey_lessons')
    .select('id, day_number, title, topic, is_published, created_at')
    .order('day_number', { ascending: true });

  if (error) {
    console.error('Error fetching lessons:', error);
    return [];
  }
  return data || [];
}

export default async function AdminJourneyPage() {
  const lessons = await getLessons();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Journey Lessons</h1>
        <Link
          href="/admin/journey/new"
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          + New Lesson
        </Link>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--color-text-muted)] mb-4">No lessons yet</p>
          <Link
            href="/admin/journey/new"
            className="text-[var(--color-primary)] hover:underline"
          >
            Create your first lesson
          </Link>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">Day</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">Title</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">Topic</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[var(--color-text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">{lesson.day_number}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">{lesson.title}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">{lesson.topic}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      lesson.is_published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {lesson.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/journey/${lesson.id}/edit`}
                      className="text-sm text-[var(--color-primary)] hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}