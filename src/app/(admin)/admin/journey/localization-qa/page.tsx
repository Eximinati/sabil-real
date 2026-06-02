import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  CROSS_LANGUAGE_CONSISTENCY_CHECKS,
  EMOTIONAL_LOCALIZATION_REVIEW_CHECKLIST,
  getDefaultChecklistMap,
  getEditorialStageLabel,
  JOURNEY_EDITORIAL_STAGE_TONES,
  LOCALIZATION_QA_REVIEW_CHECKLIST,
  PUBLISHING_SAFETY_CHECKS,
  toEditorialStage,
} from '@/lib/journey-editorial';
import type { JourneyTranslationStatus } from '@/types/journey-localization';

interface LessonQaRow {
  id: string;
  day_number: number;
  title: string;
  is_published: boolean;
  translation_status?: {
    ur?: JourneyTranslationStatus;
  } | null;
  shared_metadata?: {
    editorial?: {
      drift_flags?: string[];
      cross_language_checks?: Record<string, boolean>;
      publishing_safety_checks?: Record<string, boolean>;
      language_states?: {
        ur?: {
          emotional_review?: Record<string, boolean>;
          qa_review?: Record<string, boolean>;
        };
      };
    };
  } | null;
}

async function getLessons(): Promise<LessonQaRow[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('journey_lessons')
    .select('id, day_number, title, is_published, translation_status, shared_metadata')
    .order('day_number', { ascending: true });

  if (error) {
    return [];
  }

  return (data || []) as LessonQaRow[];
}

function summarizeMissing(map: Record<string, boolean>, expectedIds: string[]): number {
  return expectedIds.filter((id) => !map[id]).length;
}

export default async function LocalizationQaPage() {
  await requireAdmin();
  const lessons = await getLessons();

  const rows = lessons.map((lesson) => {
    const stage = toEditorialStage(lesson.translation_status?.ur);
    const stageLabel = getEditorialStageLabel(lesson.translation_status?.ur);
    const stageTone = JOURNEY_EDITORIAL_STAGE_TONES[stage];

    const editorial = lesson.shared_metadata?.editorial || {};
    const urState = editorial.language_states?.ur || {};

    const emotionalReview = {
      ...getDefaultChecklistMap(EMOTIONAL_LOCALIZATION_REVIEW_CHECKLIST),
      ...(urState.emotional_review || {}),
    };

    const qaReview = {
      ...getDefaultChecklistMap(LOCALIZATION_QA_REVIEW_CHECKLIST),
      ...(urState.qa_review || {}),
    };

    const crossLanguage = {
      ...getDefaultChecklistMap(CROSS_LANGUAGE_CONSISTENCY_CHECKS),
      ...(editorial.cross_language_checks || {}),
    };

    const publishingSafety = {
      ...getDefaultChecklistMap(PUBLISHING_SAFETY_CHECKS),
      ...(editorial.publishing_safety_checks || {}),
    };

    return {
      lesson,
      stageLabel,
      stageTone,
      missingEmotionalReview: summarizeMissing(
        emotionalReview,
        EMOTIONAL_LOCALIZATION_REVIEW_CHECKLIST.map((item) => item.id)
      ),
      missingQaReview: summarizeMissing(
        qaReview,
        LOCALIZATION_QA_REVIEW_CHECKLIST.map((item) => item.id)
      ),
      missingCrossLanguage: summarizeMissing(
        crossLanguage,
        CROSS_LANGUAGE_CONSISTENCY_CHECKS.map((item) => item.id)
      ),
      missingPublishingSafety: summarizeMissing(
        publishingSafety,
        PUBLISHING_SAFETY_CHECKS.map((item) => item.id)
      ),
      driftFlags: editorial.drift_flags || [],
    };
  });

  const totals = rows.reduce(
    (acc, row) => {
      if (row.missingEmotionalReview > 0) acc.emotional += 1;
      if (row.missingQaReview > 0) acc.qa += 1;
      if (row.missingCrossLanguage > 0) acc.crossLanguage += 1;
      if (row.missingPublishingSafety > 0) acc.publishing += 1;
      if (row.driftFlags.length > 0) acc.drift += 1;
      return acc;
    },
    { emotional: 0, qa: 0, crossLanguage: 0, publishing: 0, drift: 0 }
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Localization QA</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            A calm editorial view of multilingual readiness and emotional alignment.
          </p>
        </div>
        <Link
          href="/admin/journey"
          className="px-3 py-1.5 rounded border border-[var(--color-border)] text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
        >
          Back to lessons
        </Link>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-5">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-text-muted)]">Emotional review gaps</p>
          <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">{totals.emotional}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-text-muted)]">Localization QA gaps</p>
          <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">{totals.qa}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-text-muted)]">Cross-language gaps</p>
          <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">{totals.crossLanguage}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-text-muted)]">Publishing safety gaps</p>
          <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">{totals.publishing}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-text-muted)]">Drift watch lessons</p>
          <p className="mt-1 text-xl font-semibold text-[var(--color-text)]">{totals.drift}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)]">Day</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)]">Urdu stage</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)]">Emotional</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)]">QA</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)]">Consistency</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)]">Safety</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)]">Drift</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-text-muted)]">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.lesson.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                  <p>Day {row.lesson.day_number}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{row.lesson.title}</p>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${row.stageTone}`}>
                    {row.stageLabel}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                  {row.missingEmotionalReview === 0 ? 'Clear' : `${row.missingEmotionalReview} missing`}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                  {row.missingQaReview === 0 ? 'Clear' : `${row.missingQaReview} missing`}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                  {row.missingCrossLanguage === 0 ? 'Aligned' : `${row.missingCrossLanguage} missing`}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                  {row.missingPublishingSafety === 0 ? 'Ready' : `${row.missingPublishingSafety} missing`}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                  {row.driftFlags.length === 0 ? 'Clear' : row.driftFlags.join(', ')}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/journey/${row.lesson.id}/edit`}
                    className="text-sm text-[var(--color-primary)] hover:underline"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
