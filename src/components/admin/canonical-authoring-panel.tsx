'use client';

import type {
  CanonicalAdminSacredDraft,
  CanonicalAdminSectionDraft,
  JourneyLessonMetadata,
} from '@/types/admin-journey';
import type { CanonicalJourneySectionId } from '@/types/journey-localization';

interface CanonicalAuthoringPanelProps {
  metadata: JourneyLessonMetadata;
  sections: CanonicalAdminSectionDraft[];
  sacredDraft: CanonicalAdminSacredDraft;
  onSectionChange: (
    sectionId: CanonicalJourneySectionId,
    field: 'heading' | 'emotional_goal' | 'content_en' | 'content_ur',
    value: string
  ) => void;
  onSacredDraftChange: (
    field: keyof CanonicalAdminSacredDraft,
    value: string | number | boolean | number[]
  ) => void;
  onLoadCanonicalTemplate: () => void;
}

const SECTION_DESCRIPTION: Record<CanonicalJourneySectionId, string> = {
  'opening-reflection': 'Open the heart with gentle emotional entry.',
  'seerah-moment': 'Offer a small Prophetic human moment.',
  'quran-reflection': 'Frame revelation before the verses appear.',
  'tafsir-insight': 'Author the bridge, not scholar text itself.',
  'hadith-connection': 'Author a soft transition into hadith source text.',
  'reflection-prompt': 'Invite private internalization without pressure.',
  'tiny-action': 'Translate meaning into one lived gentle step.',
  'closing-dua': 'End in mercy, trust, and return cue.',
};

function getCanonicalHealth(sections: CanonicalAdminSectionDraft[]) {
  const total = sections.length;
  const withEnglish = sections.filter((section) => section.content_en.trim().length > 0).length;
  const withUrdu = sections.filter((section) => section.content_ur.trim().length > 0).length;

  return {
    total,
    withEnglish,
    withUrdu,
    englishPct: total === 0 ? 0 : Math.round((withEnglish / total) * 100),
    urduPct: total === 0 ? 0 : Math.round((withUrdu / total) * 100),
  };
}

function normalizeScholarIdsInput(value: string): number[] {
  const tokens = value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return Array.from(
    new Set(
      tokens
        .map((token) => Number.parseInt(token, 10))
        .filter((id) => Number.isFinite(id) && id > 0)
    )
  );
}

export function CanonicalAuthoringPanel({
  metadata,
  sections,
  sacredDraft,
  onSectionChange,
  onSacredDraftChange,
  onLoadCanonicalTemplate,
}: CanonicalAuthoringPanelProps) {
  const health = getCanonicalHealth(sections);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-medium text-[var(--color-text)]">Journey composer</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Author spiritual guidance in voice, then configure sacred references by source.
          </p>
        </div>
        <button
          type="button"
          onClick={onLoadCanonicalTemplate}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-bg)]"
        >
          Load framing templates
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">Day</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-text)]">{metadata.day_number}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">English authored coverage</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
            {health.withEnglish}/{health.total} ({health.englishPct}%)
          </p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <p className="text-xs text-[var(--color-text-muted)]">Urdu authored coverage</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
            {health.withUrdu}/{health.total} ({health.urduPct}%)
          </p>
        </div>
      </div>

      <section className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
        <p className="text-xs uppercase tracking-[0.04em] text-[var(--color-text-muted)]">Sacred source references</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Keep source content dynamic. Configure Quran range, tafsir strategy, and hadith reference once.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Quran surah</label>
            <input
              type="number"
              min={1}
              max={114}
              value={sacredDraft.quran_range_surah_id}
              onChange={(event) =>
                onSacredDraftChange('quran_range_surah_id', Number.parseInt(event.target.value, 10) || 1)
              }
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Ayah start</label>
            <input
              type="number"
              min={1}
              value={sacredDraft.quran_range_ayah_start}
              onChange={(event) =>
                onSacredDraftChange('quran_range_ayah_start', Number.parseInt(event.target.value, 10) || 1)
              }
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Ayah end</label>
            <input
              type="number"
              min={1}
              value={sacredDraft.quran_range_ayah_end}
              onChange={(event) =>
                onSacredDraftChange('quran_range_ayah_end', Number.parseInt(event.target.value, 10) || 1)
              }
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Hadith collection</label>
            <input
              type="text"
              value={sacredDraft.hadith_collection}
              onChange={(event) => onSacredDraftChange('hadith_collection', event.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
              placeholder="e.g. muslim"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Hadith number</label>
            <input
              type="number"
              min={1}
              value={sacredDraft.hadith_number}
              onChange={(event) =>
                onSacredDraftChange('hadith_number', Number.parseInt(event.target.value, 10) || 1)
              }
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-xs text-[var(--color-text-muted)] mb-1">Hadith source label</label>
          <input
            type="text"
            value={sacredDraft.hadith_source}
            onChange={(event) => onSacredDraftChange('hadith_source', event.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
            placeholder="e.g. Sahih Muslim 2564"
          />
        </div>

        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">Tafsir source mapping</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Let readers use preferences while keeping fallback spiritually stable.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
              <input
                type="checkbox"
                checked={sacredDraft.tafsir_enabled}
                onChange={(event) => onSacredDraftChange('tafsir_enabled', event.target.checked)}
                className="h-4 w-4 rounded border-[var(--color-border)]"
              />
              Enable tafsir
            </label>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Default tafsir scholar ID</label>
              <input
                type="number"
                min={1}
                value={sacredDraft.tafsir_default_id}
                onChange={(event) =>
                  onSacredDraftChange('tafsir_default_id', Number.parseInt(event.target.value, 10) || 1)
                }
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Allowed tafsir scholar IDs</label>
              <input
                type="text"
                value={sacredDraft.tafsir_scholar_ids.join(', ')}
                onChange={(event) =>
                  onSacredDraftChange('tafsir_scholar_ids', normalizeScholarIdsInput(event.target.value))
                }
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                placeholder="e.g. 169, 15"
              />
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Fallback behavior</label>
              <select
                value={sacredDraft.tafsir_fallback_behavior}
                onChange={(event) =>
                  onSacredDraftChange('tafsir_fallback_behavior', event.target.value as CanonicalAdminSacredDraft['tafsir_fallback_behavior'])
                }
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
              >
                <option value="user-preferred">Use preferred, then fallback default</option>
                <option value="default-only">Always use default scholar</option>
                <option value="hide-if-unavailable">Hide if preferred unavailable</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Reveal mode</label>
              <select
                value={sacredDraft.tafsir_reveal_mode}
                onChange={(event) =>
                  onSacredDraftChange('tafsir_reveal_mode', event.target.value as CanonicalAdminSacredDraft['tafsir_reveal_mode'])
                }
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
              >
                <option value="condensed">Condensed first</option>
                <option value="full">Full commentary first</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 space-y-5">
        {sections.map((section, index) => {
          const englishFilled = section.content_en.trim().length > 0;
          const urduFilled = section.content_ur.trim().length > 0;

          return (
            <article
              key={section.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Section {index + 1}</p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--color-text)]">{section.heading}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {SECTION_DESCRIPTION[section.id]}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      englishFilled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    EN {englishFilled ? 'ready' : 'missing'}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      urduFilled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    UR {urduFilled ? 'ready' : 'pending'}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">Section heading</label>
                  <input
                    type="text"
                    value={section.heading}
                    onChange={(event) => onSectionChange(section.id, 'heading', event.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">Emotional goal</label>
                  <input
                    type="text"
                    value={section.emotional_goal}
                    onChange={(event) => onSectionChange(section.id, 'emotional_goal', event.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
                  />
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">English authored content</label>
                  <textarea
                    value={section.content_en}
                    onChange={(event) => onSectionChange(section.id, 'content_en', event.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] resize-none"
                    rows={5}
                    placeholder="Write emotional framing in English..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">Urdu authored content</label>
                  <textarea
                    value={section.content_ur}
                    onChange={(event) => onSectionChange(section.id, 'content_ur', event.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] resize-none font-urdu"
                    rows={5}
                    dir="rtl"
                    placeholder="اردو میں روحانی رہنمائی لکھیں..."
                  />
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
