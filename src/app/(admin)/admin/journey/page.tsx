import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import { SyncContentButton } from '@/components/admin/sync-content-button';
import {
  analyzeArcRisks,
  DAY_IDENTITY_30,
  WEEKLY_COHERENCE_QA_CHECKLIST,
  WEEKLY_EMOTIONAL_ARCS,
} from '@/lib/journey-emotional-arc';

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
  const riskReport = analyzeArcRisks(DAY_IDENTITY_30);

  const weekHealth = WEEKLY_EMOTIONAL_ARCS.map((arc) => {
    const weekDays = DAY_IDENTITY_30.filter((d) => d.day >= arc.dayRange[0] && d.day <= arc.dayRange[1]);
    const uniqueTones = new Set(weekDays.map((d) => d.primaryEmotionalNote)).size;
    const uniqueCadence = new Set(weekDays.map((d) => d.cadence)).size;
    return {
      week: arc.week,
      title: arc.chapterTitle,
      score: uniqueTones + uniqueCadence,
      uniqueTones,
      uniqueCadence,
    };
  });

  const weakestWeek = [...weekHealth].sort((a, b) => a.score - b.score)[0];
  const strongestWeek = [...weekHealth].sort((a, b) => b.score - a.score)[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Journey Lessons</h1>
        <div className="flex items-center gap-3">
          <SyncContentButton />
          <Link
            href="/admin/journey/new"
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            + New Lesson
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="text-base font-medium text-[var(--color-text)]">Emotional arc overview (30-day plan)</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Weakest week: Week {weakestWeek.week} | Strongest week: Week {strongestWeek.week}
        </p>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
            <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--color-text-muted)]">Arc risks</p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--color-text-secondary)]">
              {riskReport.cadenceImbalanceWarnings.length === 0 &&
               riskReport.weekOverlapWarnings.length === 0 &&
               riskReport.repeatedToneRuns.length === 0 &&
               riskReport.repeatedActionStyleRuns.length === 0 && <li>- No major repetition drifts detected in plan.</li>}
              {riskReport.cadenceImbalanceWarnings.map((warning) => <li key={warning}>- {warning}</li>)}
              {riskReport.weekOverlapWarnings.map((warning) => <li key={warning}>- {warning}</li>)}
              {riskReport.repeatedToneRuns.map((run) => (
                <li key={`${run.tone}-${run.days.join('-')}`}>- Repeated tone run: {run.tone} (days {run.days.join(', ')})</li>
              ))}
              {riskReport.repeatedActionStyleRuns.map((run) => (
                <li key={`${run.actionStyle}-${run.days.join('-')}`}>- Repeated action run: {run.actionStyle} (days {run.days.join(', ')})</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
            <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--color-text-muted)]">Weekly coherence QA</p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--color-text-secondary)]">
              {WEEKLY_COHERENCE_QA_CHECKLIST.map((line) => <li key={line}>- {line}</li>)}
            </ul>
          </div>
        </div>
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
