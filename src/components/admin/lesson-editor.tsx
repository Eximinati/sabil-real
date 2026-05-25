'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  JourneyLessonMetadata, 
  LessonBlock, 
  BlockType,
  BLOCK_TYPE_LABELS,
  createEmptyBlock 
} from '@/types/admin-journey';
import { LessonRenderer } from './lesson-renderer';
import { saveLesson } from '@/lib/admin-journey-actions';
import { useToast } from '@/hooks/use-toast';
import { MarkdownImporter } from './markdown-importer';
import {
  createStarterTemplateBlocks,
  EMOTIONAL_QA_CHECKLIST,
  getDayTemplateCoverage,
  SABIL_CONTENT_SYSTEM,
  validateDayTemplateContract,
} from '@/lib/journey-day-template';
import { WEEKLY_EMOTIONAL_ARCS, getDayIdentity, getWeekForDay } from '@/lib/journey-emotional-arc';
import {
  URDU_EMOTIONAL_QA_CHECKLIST,
  URDU_FORBIDDEN_PATTERNS,
  URDU_GOOD_BAD_EXAMPLES,
  URDU_READABILITY_STANDARDS,
  URDU_TONE_PRINCIPLES,
} from '@/lib/urdu-localization-system';
import {
  CROSS_LANGUAGE_CONSISTENCY_CHECKS,
  EMOTIONAL_LOCALIZATION_REVIEW_CHECKLIST,
  getDefaultChecklistMap,
  hasLocalizedBlockContent,
  hasLocalizedMetadataContent,
  JOURNEY_EDITORIAL_STAGE_LABELS,
  JOURNEY_EDITORIAL_STAGE_ORDER,
  LOCALIZATION_QA_REVIEW_CHECKLIST,
  normalizeTranslationStages,
  PUBLISHING_SAFETY_CHECKS,
  toEditorialStage,
} from '@/lib/journey-editorial';
import type { JourneyEditorialStage } from '@/types/journey-localization';

interface LessonEditorProps {
  initialData?: {
    metadata: JourneyLessonMetadata;
    blocks: LessonBlock[];
  };
  userId: string;
}

const BLOCK_TYPES: BlockType[] = [
  'heading', 'paragraph', 'arabic', 'transliteration', 'verse', 'quote', 'reflection', 'list'
];

export function LessonEditor({ initialData, userId }: LessonEditorProps) {
  const router = useRouter();
  const toast = useToast();
  
  const [metadata, setMetadata] = useState<JourneyLessonMetadata>(
    initialData?.metadata || {
      day_number: 1,
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
        lesson_order: 1,
        qa_status: {},
      },
    }
  );

  const [blocks, setBlocks] = useState<LessonBlock[]>(
    initialData?.blocks || []
  );

  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const templateCoverage = getDayTemplateCoverage(metadata.day_number, blocks);
  const emotionalQa = metadata.emotional_qa || {};
  const hasUrduLocalizedContent =
    hasLocalizedMetadataContent(metadata.localized_content, 'ur') ||
    hasLocalizedBlockContent(blocks, 'ur');

  const normalizedStatusForUi = normalizeTranslationStages(metadata.translation_status, {
    hasContentByLanguage: {
      en: true,
      ur: hasUrduLocalizedContent,
    },
    isPublished: metadata.is_published,
  });

  const editorial = metadata.shared_metadata?.editorial || {};
  const urEditorialState = editorial.language_states?.ur || {};

  const urStage = toEditorialStage(normalizedStatusForUi.ur);

  const urEmotionalReview = {
    ...getDefaultChecklistMap(EMOTIONAL_LOCALIZATION_REVIEW_CHECKLIST),
    ...(urEditorialState.emotional_review || {}),
  };

  const urQaReview = {
    ...getDefaultChecklistMap(LOCALIZATION_QA_REVIEW_CHECKLIST),
    ...(urEditorialState.qa_review || {}),
  };

  const crossLanguageChecks = {
    ...getDefaultChecklistMap(CROSS_LANGUAGE_CONSISTENCY_CHECKS),
    ...(editorial.cross_language_checks || {}),
  };

  const publishingSafetyChecks = {
    ...getDefaultChecklistMap(PUBLISHING_SAFETY_CHECKS),
    ...(editorial.publishing_safety_checks || {}),
  };

  useEffect(() => {
    const week = getWeekForDay(metadata.day_number);
    const weekArc = WEEKLY_EMOTIONAL_ARCS.find((arc) => arc.week === week);
    const dayIdentity = getDayIdentity(metadata.day_number);

    if (!weekArc && !dayIdentity) {
      return;
    }

    setMetadata((prev) => {
      const existingShared = prev.shared_metadata || {};
      const nextShared = {
        ...existingShared,
        lesson_order: prev.day_number,
        week_chapter: existingShared.week_chapter || weekArc?.chapterTitle,
        emotional_note: existingShared.emotional_note || dayIdentity?.primaryEmotionalNote,
        arc_identity: existingShared.arc_identity || (weekArc ? `week-${weekArc.week}` : undefined),
        estimated_minutes: prev.estimated_minutes,
        qa_status: {
          ...(existingShared.qa_status || {}),
          ...(prev.emotional_qa || {}),
        },
      };

      const nextStatuses = {
        ...normalizeTranslationStages(prev.translation_status, {
          hasContentByLanguage: {
            en: true,
            ur: hasLocalizedMetadataContent(prev.localized_content, 'ur') || hasLocalizedBlockContent(blocks, 'ur'),
          },
          isPublished: prev.is_published,
        }),
      };

      let changed = false;
      if (JSON.stringify(existingShared) !== JSON.stringify(nextShared)) {
        changed = true;
      }
      if (JSON.stringify(prev.translation_status || {}) !== JSON.stringify(nextStatuses)) {
        changed = true;
      }

      if (!changed) {
        return prev;
      }

      return {
        ...prev,
        shared_metadata: nextShared,
        translation_status: nextStatuses,
      };
    });
  }, [metadata.day_number, metadata.estimated_minutes, metadata.emotional_qa, blocks]);

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [metadata, blocks]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSave = async (publish: boolean = false) => {
    if (!metadata.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const updatedMetadata: JourneyLessonMetadata = {
      ...metadata,
      is_published: publish,
      translation_status: normalizedStatusForUi,
    };

    if (publish) {
      const missingChecklist = EMOTIONAL_QA_CHECKLIST.filter((item) => !updatedMetadata.emotional_qa?.[item.id]);
      if (missingChecklist.length > 0) {
        toast.error(`Complete emotional QA: ${missingChecklist[0].label}`);
        return;
      }

      const templateValidation = validateDayTemplateContract(updatedMetadata.day_number, blocks);
      if (!templateValidation.valid && templateValidation.required) {
        toast.error(`Day template missing: ${templateValidation.missingSections[0].title}`);
        return;
      }
    }

    setSaving(true);

    const result = await saveLesson(
      { metadata: updatedMetadata, blocks },
      userId
    );

    setSaving(false);

    if (result.success) {
      setMetadata((prev) => ({
        ...updatedMetadata,
        shared_metadata: {
          ...(prev.shared_metadata || {}),
          ...(updatedMetadata.shared_metadata || {}),
          editorial: {
            ...(prev.shared_metadata?.editorial || {}),
            ...(updatedMetadata.shared_metadata?.editorial || {}),
          },
        },
      }));
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast.success(publish ? 'Lesson published!' : 'Draft saved');
      
      if (!initialData?.metadata?.id) {
        router.replace(`/admin/journey/${result.lessonId}/edit`);
      }
    } else {
      toast.error(result.error || 'Failed to save');
    }
  };

  const addBlock = (type: BlockType) => {
    const newBlock = createEmptyBlock(type, blocks.length);
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (index: number, updates: Partial<LessonBlock>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    setBlocks(newBlocks);
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks.map((b, i) => ({ ...b, order_index: i })));
  };

  const insertTemplate = () => {
    const starter = createStarterTemplateBlocks(metadata.day_number);

    if (blocks.length === 0) {
      setBlocks(starter);
      return;
    }

    const shouldAppend = window.confirm('Append the day template blocks to your current content?');
    if (!shouldAppend) return;

    const offset = blocks.length;
    const appended = starter.map((block) => ({
      ...block,
      order_index: block.order_index + offset,
    }));

    setBlocks([...blocks, ...appended]);
  };

  const setUrEditorialStage = (nextStage: JourneyEditorialStage) => {
    if (nextStage !== 'untranslated' && !hasUrduLocalizedContent) {
      toast.info('Add Urdu localized text first, then move beyond untranslated.');
      return;
    }

    setMetadata((prev) => {
      const nextStatus = normalizeTranslationStages(
        {
          ...(prev.translation_status || {}),
          ur: nextStage,
        },
        {
          hasContentByLanguage: {
            en: true,
            ur: hasLocalizedMetadataContent(prev.localized_content, 'ur') || hasLocalizedBlockContent(blocks, 'ur'),
          },
          isPublished: prev.is_published,
        }
      );

      return {
        ...prev,
        translation_status: nextStatus,
      };
    });
  };

  const toggleUrChecklist = (
    kind: 'emotional_review' | 'qa_review',
    checklistId: string,
    checked: boolean
  ) => {
    setMetadata((prev) => {
      const existingEditorial = prev.shared_metadata?.editorial || {};
      const existingUrState = existingEditorial.language_states?.ur || {};

      return {
        ...prev,
        shared_metadata: {
          ...(prev.shared_metadata || {}),
          editorial: {
            ...existingEditorial,
            language_states: {
              ...(existingEditorial.language_states || {}),
              ur: {
                ...existingUrState,
                [kind]: {
                  ...((existingUrState as Record<string, unknown>)[kind] as Record<string, boolean> || {}),
                  [checklistId]: checked,
                },
              },
            },
          },
        },
      };
    });
  };

  const toggleEditorialMap = (
    kind: 'cross_language_checks' | 'publishing_safety_checks',
    checklistId: string,
    checked: boolean
  ) => {
    setMetadata((prev) => {
      const existingEditorial = prev.shared_metadata?.editorial || {};

      return {
        ...prev,
        shared_metadata: {
          ...(prev.shared_metadata || {}),
          editorial: {
            ...existingEditorial,
            [kind]: {
              ...((existingEditorial as Record<string, unknown>)[kind] as Record<string, boolean> || {}),
              [checklistId]: checked,
            },
          },
        },
      };
    });
  };

  const markUrSyncedWithCurrentSource = () => {
    const sourceHash = metadata.shared_metadata?.editorial?.source_hash;
    if (!sourceHash) {
      toast.info('Save once to generate source sync hash.');
      return;
    }

    setMetadata((prev) => {
      const existingEditorial = prev.shared_metadata?.editorial || {};
      const existingUrState = existingEditorial.language_states?.ur || {};

      return {
        ...prev,
        shared_metadata: {
          ...(prev.shared_metadata || {}),
          editorial: {
            ...existingEditorial,
            language_states: {
              ...(existingEditorial.language_states || {}),
              ur: {
                ...existingUrState,
                synced_source_hash: sourceHash,
              },
            },
          },
        },
      };
    });

    toast.success('Urdu sync marked to current source revision.');
  };

  const missingUrEmotionalReview = EMOTIONAL_LOCALIZATION_REVIEW_CHECKLIST.filter(
    (item) => !urEmotionalReview[item.id]
  );
  const missingUrQaReview = LOCALIZATION_QA_REVIEW_CHECKLIST.filter(
    (item) => !urQaReview[item.id]
  );
  const missingCrossLanguageChecks = CROSS_LANGUAGE_CONSISTENCY_CHECKS.filter(
    (item) => !crossLanguageChecks[item.id]
  );
  const missingPublishingSafetyChecks = PUBLISHING_SAFETY_CHECKS.filter(
    (item) => !publishingSafetyChecks[item.id]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Editor Panel */}
      <div className="flex-1 min-w-0">
        {/* Metadata Section */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-4">Lesson Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                Day Number
              </label>
              <input
                type="number"
                value={metadata.day_number}
                onChange={(e) => setMetadata({ ...metadata, day_number: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
                min={1}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                Estimated Minutes
              </label>
              <input
                type="number"
                value={metadata.estimated_minutes}
                onChange={(e) => setMetadata({ ...metadata, estimated_minutes: parseInt(e.target.value) || 15 })}
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
                min={1}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              Title
            </label>
            <input
              type="text"
              value={metadata.title}
              onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
              placeholder="Lesson title"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              Subtitle
            </label>
            <input
              type="text"
              value={metadata.subtitle}
              onChange={(e) => setMetadata({ ...metadata, subtitle: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
              placeholder="Optional subtitle"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              Topic
            </label>
            <input
              type="text"
              value={metadata.topic}
              onChange={(e) => setMetadata({ ...metadata, topic: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
              placeholder="e.g., Purpose & Creation"
            />
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                Urdu editorial stage
              </label>
              <select
                value={urStage}
                onChange={(e) => setUrEditorialStage(e.target.value as JourneyEditorialStage)}
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
              >
                {JOURNEY_EDITORIAL_STAGE_ORDER.map((stage) => (
                  <option key={stage} value={stage}>
                    {JOURNEY_EDITORIAL_STAGE_LABELS[stage]}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                This stage tracks emotional readiness, not translation speed.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                Arc identity
              </label>
              <input
                type="text"
                value={metadata.shared_metadata?.arc_identity || ''}
                onChange={(e) =>
                  setMetadata({
                    ...metadata,
                    shared_metadata: {
                      ...(metadata.shared_metadata || {}),
                      arc_identity: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
                placeholder="e.g., week-1"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              Urdu localized fields (optional in Phase 5C)
            </label>
            <div className="grid grid-cols-1 gap-3">
              <input
                type="text"
                value={metadata.localized_content?.ur?.title || ''}
                onChange={(e) =>
                  setMetadata({
                    ...metadata,
                    localized_content: {
                      ...(metadata.localized_content || {}),
                      ur: {
                        ...(metadata.localized_content?.ur || {}),
                        title: e.target.value,
                      },
                    },
                  })
                }
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
                placeholder="Urdu title"
                dir="rtl"
              />
              <textarea
                value={metadata.localized_content?.ur?.description || ''}
                onChange={(e) =>
                  setMetadata({
                    ...metadata,
                    localized_content: {
                      ...(metadata.localized_content || {}),
                      ur: {
                        ...(metadata.localized_content?.ur || {}),
                        description: e.target.value,
                      },
                    },
                  })
                }
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none"
                rows={3}
                placeholder="Urdu overview"
                dir="rtl"
              />
              <textarea
                value={metadata.localized_content?.ur?.reflection_prompt || ''}
                onChange={(e) =>
                  setMetadata({
                    ...metadata,
                    localized_content: {
                      ...(metadata.localized_content || {}),
                      ur: {
                        ...(metadata.localized_content?.ur || {}),
                        reflection_prompt: e.target.value,
                      },
                    },
                  })
                }
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none"
                rows={3}
                placeholder="Urdu reflection prompt"
                dir="rtl"
              />
            </div>

            <div className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-[var(--color-text-muted)]">
                  Source sync hash: <span className="font-mono">{metadata.shared_metadata?.editorial?.source_hash || 'pending-save'}</span>
                </p>
                <button
                  type="button"
                  onClick={markUrSyncedWithCurrentSource}
                  className="px-2.5 py-1 rounded border border-[var(--color-border)] text-xs text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                >
                  Mark Urdu synced
                </button>
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                Urdu synced hash: <span className="font-mono">{metadata.shared_metadata?.editorial?.language_states?.ur?.synced_source_hash || 'not-set'}</span>
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              Description (Overview)
            </label>
            <textarea
              value={metadata.description}
              onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none"
              rows={3}
              placeholder="Brief description for the lesson overview"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <input
              type="checkbox"
              id="is_published"
              checked={metadata.is_published}
              onChange={(e) => setMetadata({ ...metadata, is_published: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--color-border)]"
            />
            <label htmlFor="is_published" className="text-sm text-[var(--color-text)]">
              Published
            </label>
          </div>

          {metadata.day_number >= 2 && metadata.day_number <= 30 && (
            <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
              <h3 className="text-sm font-medium text-[var(--color-text)]">Day template contract (Days 2-30)</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
                Keep narrative flow consistent: arrival, opening reflection, seerah, Quran, tafsir, hadith, reflection, tiny action, closing.
              </p>
            </div>
          )}

          <details className="group mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-[var(--color-text)]">
              Sabil writing guidance
              <span className="text-xs text-[var(--color-text-muted)] transition-transform group-open:rotate-180">▼</span>
            </summary>

            <div className="mt-3 grid gap-3">
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--color-text-muted)]">Tone priorities</p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--color-text-secondary)]">
                  {SABIL_CONTENT_SYSTEM.writingPhilosophy.tone.map((line) => (
                    <li key={line}>- {line}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--color-text-muted)]">Avoid</p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--color-text-secondary)]">
                  {SABIL_CONTENT_SYSTEM.writingPhilosophy.avoid.slice(0, 5).map((line) => (
                    <li key={line}>- {line}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--color-text-muted)]">Emotional pacing</p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--color-text-secondary)]">
                  {SABIL_CONTENT_SYSTEM.emotionalPacingRules.slice(0, 4).map((line) => (
                    <li key={line}>- {line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>

          <details className="group mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-[var(--color-text)]">
              Urdu emotional localization guidance (Phase 5D)
              <span className="text-xs text-[var(--color-text-muted)] transition-transform group-open:rotate-180">▼</span>
            </summary>

            <div className="mt-3 grid gap-3">
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--color-text-muted)]">Tone principles</p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--color-text-secondary)]">
                  {URDU_TONE_PRINCIPLES.map((line) => (
                    <li key={line}>- {line}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--color-text-muted)]">Forbidden patterns</p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--color-text-secondary)]">
                  {URDU_FORBIDDEN_PATTERNS.map((line) => (
                    <li key={line}>- {line}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--color-text-muted)]">Readability standards</p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--color-text-secondary)]">
                  {URDU_READABILITY_STANDARDS.map((line) => (
                    <li key={line}>- {line}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--color-text-muted)]">Good vs bad Urdu examples</p>
                <div className="mt-2 space-y-3">
                  {URDU_GOOD_BAD_EXAMPLES.slice(0, 4).map((example) => (
                    <div key={example.surface} className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-2">
                      <p className="text-xs font-medium text-[var(--color-text)] capitalize">{example.surface}</p>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">Bad: {example.bad}</p>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Better: {example.better}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--color-text-muted)]">Urdu emotional QA</p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--color-text-secondary)]">
                  {URDU_EMOTIONAL_QA_CHECKLIST.map((item) => (
                    <li key={item.id}>- {item.label}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        </div>

        {/* Blocks Section */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-[var(--color-text)]">Content Blocks</h2>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-3 py-1.5 bg-[var(--color-accent)] text-white text-sm rounded-lg hover:opacity-90"
              >
                Import Markdown
              </button>

              {metadata.day_number >= 2 && metadata.day_number <= 30 && (
                <button
                  onClick={insertTemplate}
                  className="px-3 py-1.5 border border-[var(--color-border)] text-[var(--color-text)] text-sm rounded-lg hover:bg-[var(--color-bg)]"
                >
                  Insert Day Template
                </button>
              )}

              <div className="relative group">
                <button className="px-3 py-1.5 bg-[var(--color-primary)] text-white text-sm rounded-lg hover:bg-[var(--color-primary-hover)]">
                  + Add Block
                </button>
                <div className="absolute right-0 top-full mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[180px]">
                  {BLOCK_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => addBlock(type)}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] first:rounded-t-lg last:rounded-b-lg"
                    >
                      {BLOCK_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {blocks.length === 0 ? (
            <p className="text-[var(--color-text-muted)] text-sm text-center py-8">
              No content blocks yet. Click "Add Block" to start building your lesson.
            </p>
          ) : (
            <div className="space-y-4">
              {blocks.map((block, index) => (
                <BlockEditor
                  key={block.id || index}
                  block={block}
                  index={index}
                  onUpdate={(updates) => updateBlock(index, updates)}
                  onRemove={() => removeBlock(index)}
                  onMoveUp={() => moveBlock(index, 'up')}
                  onMoveDown={() => moveBlock(index, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < blocks.length - 1}
                />
              ))}
            </div>
          )}

          {metadata.day_number >= 2 && metadata.day_number <= 30 && (
            <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
              <p className="text-sm font-medium text-[var(--color-text)]">Template coverage</p>
              <div className="mt-3 grid gap-2">
                {templateCoverage.sections.map((section) => {
                  const isMatched = templateCoverage.matchedSectionIds.has(section.id);
                  return (
                    <div
                      key={section.id}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                        isMatched
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      <span>{section.title}</span>
                      <span>{isMatched ? 'Included' : 'Missing'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-medium text-[var(--color-text)]">Emotional QA checklist</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Confirm each point before publishing so every day remains emotionally safe and coherent.
          </p>

          <div className="mt-4 space-y-3">
            {EMOTIONAL_QA_CHECKLIST.map((item) => (
              <label key={item.id} className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                <input
                  type="checkbox"
                  checked={!!emotionalQa[item.id]}
                  onChange={(e) => {
                    setMetadata((prev) => ({
                      ...prev,
                      emotional_qa: {
                        ...(prev.emotional_qa || {}),
                        [item.id]: e.target.checked,
                      },
                    }));
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)]"
                />
                <span className="text-sm leading-relaxed text-[var(--color-text)]">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-medium text-[var(--color-text)]">Localization emotional review (Urdu)</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Review emotional authenticity before moving from draft localized to QA approved.
          </p>

          <div className="mt-4 space-y-3">
            {EMOTIONAL_LOCALIZATION_REVIEW_CHECKLIST.map((item) => (
              <label key={item.id} className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                <input
                  type="checkbox"
                  checked={!!urEmotionalReview[item.id]}
                  onChange={(e) => toggleUrChecklist('emotional_review', item.id, e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)]"
                />
                <span className="text-sm leading-relaxed text-[var(--color-text)]">{item.label}</span>
              </label>
            ))}
          </div>

          {missingUrEmotionalReview.length > 0 && (
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              Remaining emotional review item: {missingUrEmotionalReview[0].label}
            </p>
          )}
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-medium text-[var(--color-text)]">Localization QA and cross-language consistency</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Keep English and Urdu emotionally parallel as one journey.
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
              <p className="text-sm font-medium text-[var(--color-text)]">Urdu localization QA</p>
              <div className="mt-3 space-y-2">
                {LOCALIZATION_QA_REVIEW_CHECKLIST.map((item) => (
                  <label key={item.id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={!!urQaReview[item.id]}
                      onChange={(e) => toggleUrChecklist('qa_review', item.id, e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)]"
                    />
                    <span className="text-sm text-[var(--color-text)] leading-relaxed">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
              <p className="text-sm font-medium text-[var(--color-text)]">Cross-language consistency checks</p>
              <div className="mt-3 space-y-2">
                {CROSS_LANGUAGE_CONSISTENCY_CHECKS.map((item) => (
                  <label key={item.id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={!!crossLanguageChecks[item.id]}
                      onChange={(e) => toggleEditorialMap('cross_language_checks', item.id, e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)]"
                    />
                    <span className="text-sm text-[var(--color-text)] leading-relaxed">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {(missingUrQaReview.length > 0 || missingCrossLanguageChecks.length > 0) && (
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              Next gap: {missingUrQaReview[0]?.label || missingCrossLanguageChecks[0]?.label}
            </p>
          )}
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-medium text-[var(--color-text)]">Publishing safety checks</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Lightweight safeguards to prevent drift and orphaned translations.
          </p>

          <div className="mt-4 space-y-3">
            {PUBLISHING_SAFETY_CHECKS.map((item) => (
              <label key={item.id} className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                <input
                  type="checkbox"
                  checked={!!publishingSafetyChecks[item.id]}
                  onChange={(e) => toggleEditorialMap('publishing_safety_checks', item.id, e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)]"
                />
                <span className="text-sm leading-relaxed text-[var(--color-text)]">{item.label}</span>
              </label>
            ))}
          </div>

          {missingPublishingSafetyChecks.length > 0 && (
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              Required before publish: {missingPublishingSafetyChecks[0].label}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-[var(--color-text-muted)]">
            {hasUnsavedChanges && <span>Unsaved changes</span>}
            {lastSaved && !hasUnsavedChanges && (
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            )}
            {!hasUnsavedChanges && !lastSaved && (
              <span>Content version {metadata.shared_metadata?.content_version || 1}</span>
            )}
            {metadata.shared_metadata?.editorial?.drift_flags?.length ? (
              <span className="ml-2 text-amber-700">
                Drift flags: {metadata.shared_metadata?.editorial?.drift_flags?.join(', ')}
              </span>
            ) : null}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text)] rounded-lg hover:bg-[var(--color-bg)] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              {saving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      {showPreview && (
        <div className="lg:w-[400px] shrink-0">
          <div className="sticky top-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-[var(--color-text-muted)]">Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                Hide
              </button>
            </div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto">
              <LessonRenderer metadata={metadata} blocks={blocks} />
            </div>
          </div>
        </div>
      )}

      {/* Import Markdown Modal */}
      <MarkdownImporter
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={(importedBlocks) => {
          const newBlocks = importedBlocks.map((block, idx) => ({
            ...block,
            order_index: blocks.length + idx,
          }));
          setBlocks([...blocks, ...newBlocks]);
          setHasUnsavedChanges(true);
          toast.success(`Imported ${newBlocks.length} blocks`);
        }}
        existingBlocks={blocks}
      />
    </div>
  );
}

interface BlockEditorProps {
  block: LessonBlock;
  index: number;
  onUpdate: (updates: Partial<LessonBlock>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function BlockEditor({
  block,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: BlockEditorProps) {
  return (
    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase">
            {BLOCK_TYPE_LABELS[block.block_type]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30"
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30"
            title="Move down"
          >
            ↓
          </button>
          <button
            onClick={onRemove}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)] ml-2"
            title="Remove block"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <BlockContentEditor block={block} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

function BlockContentEditor({
  block,
  onUpdate,
}: {
  block: LessonBlock;
  onUpdate: (updates: Partial<LessonBlock>) => void;
}) {
  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...block.content, [key]: value } });
  };

  switch (block.block_type) {
    case 'heading':
      return (
        <div className="space-y-3">
          <select
            value={block.content.level || 2}
            onChange={(e) => updateContent('level', parseInt(e.target.value))}
            className="px-2 py-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-sm"
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
          <input
            type="text"
            value={block.content.text || ''}
            onChange={(e) => updateContent('text', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
            placeholder="Heading text"
          />
        </div>
      );

    case 'paragraph':
      const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateContent('text', e.target.value);
      };
      return (
        <div>
          <div className="flex gap-1 mb-2">
            <button
              type="button"
              onClick={() => {
                const currentText = block.content.text || '';
                const selection = window.getSelection()?.toString();
                if (selection) {
                  const newText = currentText.replace(selection, `**${selection}**`);
                  updateContent('text', newText);
                }
              }}
              className="px-2 py-1 text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded hover:bg-[var(--color-border)]"
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => {
                const currentText = block.content.text || '';
                const selection = window.getSelection()?.toString();
                if (selection) {
                  const newText = currentText.replace(selection, `*${selection}*`);
                  updateContent('text', newText);
                }
              }}
              className="px-2 py-1 text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded hover:bg-[var(--color-border)] italic"
              title="Italic"
            >
              I
            </button>
          </div>
          <textarea
            value={block.content.text || ''}
            onChange={handleTextChange}
            className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none font-mono text-sm"
            rows={6}
            placeholder="Paragraph text... (Use **text** for bold, *text* for italic)"
          />
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Use **text** for bold, *text* for italic
          </p>
        </div>
      );

    case 'arabic':
      return (
        <div>
          <textarea
            value={block.content.text || ''}
            onChange={(e) => updateContent('text', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none font-arabic text-2xl text-right"
            rows={3}
            dir="rtl"
            placeholder="Arabic text..."
          />
        </div>
      );

    case 'transliteration':
      return (
        <div className="space-y-3">
          <textarea
            value={block.content.text || ''}
            onChange={(e) => updateContent('text', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none"
            rows={2}
            placeholder="Transliteration..."
          />
          <textarea
            value={block.content.translation || ''}
            onChange={(e) => updateContent('translation', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none"
            rows={2}
            placeholder="Translation..."
          />
        </div>
      );

    case 'verse':
      return (
        <div>
          <input
            type="text"
            value={block.content.verse_key || ''}
            onChange={(e) => updateContent('verse_key', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] mb-2"
            placeholder="Verse key (e.g., 2:255)"
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            This will render the verse with audio using existing Quran systems.
          </p>
        </div>
      );

    case 'quote':
      return (
        <div className="space-y-3">
          <textarea
            value={block.content.text || ''}
            onChange={(e) => updateContent('text', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none"
            rows={3}
            placeholder="Quote text..."
          />
          <input
            type="text"
            value={block.content.source || ''}
            onChange={(e) => updateContent('source', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
            placeholder="Source (e.g., Sahih Muslim 2865)"
          />
        </div>
      );

    case 'reflection':
      const prompts = block.content.prompts || [''];
      const updatePrompt = (idx: number, value: string) => {
        const newPrompts = [...prompts];
        newPrompts[idx] = value;
        updateContent('prompts', newPrompts);
      };
      const addPrompt = () => updateContent('prompts', [...prompts, '']);
      const removePrompt = (idx: number) => {
        if (prompts.length > 1) {
          updateContent('prompts', prompts.filter((_, i) => i !== idx));
        }
      };
      return (
        <div className="space-y-2">
          {prompts.map((prompt, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="mt-2 text-sm font-medium text-[var(--color-primary)]">{idx + 1}.</span>
              <textarea
                value={prompt}
                onChange={(e) => updatePrompt(idx, e.target.value)}
                className="flex-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] resize-none"
                rows={2}
                placeholder={`Reflection prompt ${idx + 1}...`}
              />
              <button
                onClick={() => removePrompt(idx)}
                className="mt-2 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
                title="Remove prompt"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={addPrompt}
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            + Add reflection prompt
          </button>
        </div>
      );

    case 'list':
      const items = block.content.items || [''];
      const updateItem = (idx: number, value: string) => {
        const newItems = [...items];
        newItems[idx] = value;
        updateContent('items', newItems);
      };
      const addItem = () => updateContent('items', [...items, '']);
      const removeItem = (idx: number) => {
        if (items.length > 1) {
          updateContent('items', items.filter((_, i) => i !== idx));
        }
      };
      return (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-[var(--color-text-muted)]">•</span>
              <input
                type="text"
                value={item}
                onChange={(e) => updateItem(idx, e.target.value)}
                className="flex-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
                placeholder="List item..."
              />
              <button
                onClick={() => removeItem(idx)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={addItem}
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            + Add item
          </button>
        </div>
      );

    default:
      return null;
  }
}
