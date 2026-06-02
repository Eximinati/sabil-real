'use server';

import { createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { supabaseServer } from './supabase-server';
import { journeyCache } from './journey-server-cache';
import type { LessonWithBlocks, JourneyLessonMetadata, LessonBlock } from '@/types/admin-journey';
import { EMOTIONAL_QA_CHECKLIST, validateDayTemplateContract } from './journey-day-template';
import { analyzeCanonicalJourneyDraft } from './journey-canonical-qa';
import {
  CROSS_LANGUAGE_CONSISTENCY_CHECKS,
  EMOTIONAL_LOCALIZATION_REVIEW_CHECKLIST,
  getDefaultChecklistMap,
  hasLocalizedBlockContent,
  hasLocalizedMetadataContent,
  isStageAtLeast,
  JOURNEY_EDITORIAL_STAGE_ORDER,
  LOCALIZATION_QA_REVIEW_CHECKLIST,
  normalizeTranslationStages,
  PUBLISHING_SAFETY_CHECKS,
  toEditorialStage,
} from './journey-editorial';
import type {
  JourneyEditorialStage,
  JourneyEditorialWorkflowState,
  JourneyLanguageEditorialState,
  JourneySharedMetadata,
  JourneyTranslationStatusMap,
} from '@/types/journey-localization';

function isCanonicalAuthoringDay(dayNumber: number): boolean {
  return dayNumber >= 1 && dayNumber <= 5;
}

function hashLessonSource(metadata: JourneyLessonMetadata, blocks: LessonBlock[]): string {
  const payload = JSON.stringify({
    day_number: metadata.day_number,
    title: metadata.title,
    subtitle: metadata.subtitle,
    topic: metadata.topic,
    description: metadata.description,
    estimated_minutes: metadata.estimated_minutes,
    localized_content: metadata.localized_content || {},
    blocks: blocks.map((block) => ({
      order_index: block.order_index,
      block_type: block.block_type,
      content: block.content,
    })),
  });

  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

function getHighestStage(languageStates: Partial<Record<'en' | 'ur', JourneyLanguageEditorialState>>): JourneyEditorialStage {
  let highest: JourneyEditorialStage = 'untranslated';

  for (const stage of JOURNEY_EDITORIAL_STAGE_ORDER) {
    const hasStage = Object.values(languageStates).some((state) => state?.stage === stage);
    if (hasStage) {
      highest = stage;
    }
  }

  return highest;
}

function normalizeSharedMetadata(
  metadata: JourneyLessonMetadata,
  blocks: LessonBlock[],
  translationStatus: JourneyTranslationStatusMap,
  contentVersion: number,
  userId: string
): JourneySharedMetadata {
  const nowIso = new Date().toISOString();
  const sourceHash = hashLessonSource(metadata, blocks);
  const sourceRevision = `day-${String(metadata.day_number).padStart(2, '0')}-v${contentVersion}`;
  const qa = metadata.emotional_qa || {};
  const existingShared = metadata.shared_metadata || {};
  const existingEditorial = existingShared.editorial || {};

  const crossLanguageChecks = {
    ...getDefaultChecklistMap(CROSS_LANGUAGE_CONSISTENCY_CHECKS),
    ...(existingEditorial.cross_language_checks || {}),
  };

  const publishingSafetyChecks = {
    ...getDefaultChecklistMap(PUBLISHING_SAFETY_CHECKS),
    ...(existingEditorial.publishing_safety_checks || {}),
  };

  const existingLanguageStates = existingEditorial.language_states || {};

  const languageStates: Partial<Record<'en' | 'ur', JourneyLanguageEditorialState>> = {
    en: {
      ...(existingLanguageStates.en || {}),
      stage: toEditorialStage(translationStatus.en),
      emotional_review: {
        ...getDefaultChecklistMap(EMOTIONAL_LOCALIZATION_REVIEW_CHECKLIST, true),
        ...(existingLanguageStates.en?.emotional_review || {}),
      },
      qa_review: {
        ...getDefaultChecklistMap(LOCALIZATION_QA_REVIEW_CHECKLIST, true),
        ...(existingLanguageStates.en?.qa_review || {}),
      },
      synced_source_hash: sourceHash,
      content_hash: sourceHash,
      updated_at: nowIso,
      updated_by: userId,
      reviewer_note: existingLanguageStates.en?.reviewer_note,
    },
    ur: {
      ...(existingLanguageStates.ur || {}),
      stage: toEditorialStage(translationStatus.ur),
      emotional_review: {
        ...getDefaultChecklistMap(EMOTIONAL_LOCALIZATION_REVIEW_CHECKLIST),
        ...(existingLanguageStates.ur?.emotional_review || {}),
      },
      qa_review: {
        ...getDefaultChecklistMap(LOCALIZATION_QA_REVIEW_CHECKLIST),
        ...(existingLanguageStates.ur?.qa_review || {}),
      },
      synced_source_hash: existingLanguageStates.ur?.synced_source_hash || sourceHash,
      content_hash: sourceHash,
      updated_at: nowIso,
      updated_by: userId,
      reviewer_note: existingLanguageStates.ur?.reviewer_note,
    },
  };

  const urStage = languageStates.ur?.stage || 'untranslated';
  const driftFlags = new Set(existingEditorial.drift_flags || []);
  const urSyncedHash = languageStates.ur?.synced_source_hash;

  if (isStageAtLeast(urStage, 'draft_localized') && urSyncedHash && urSyncedHash !== sourceHash) {
    driftFlags.add('ur-needs-resync-with-source');
  } else {
    driftFlags.delete('ur-needs-resync-with-source');
  }

  if (urStage === 'draft_localized') {
    driftFlags.add('ur-awaiting-emotional-review');
  } else {
    driftFlags.delete('ur-awaiting-emotional-review');
  }

  if (urStage === 'emotionally_reviewed') {
    driftFlags.add('ur-awaiting-qa-approval');
  } else {
    driftFlags.delete('ur-awaiting-qa-approval');
  }

  if (isStageAtLeast(urStage, 'qa_approved')) {
    driftFlags.delete('ur-awaiting-emotional-review');
    driftFlags.delete('ur-awaiting-qa-approval');
  }

  const highestStage = getHighestStage(languageStates);

  return {
    ...existingShared,
    lesson_order: existingShared.lesson_order || metadata.day_number,
    estimated_minutes: metadata.estimated_minutes,
    content_version: contentVersion,
    source_revision: sourceRevision,
    qa_status: {
      ...(existingShared.qa_status || {}),
      ...qa,
    },
    editorial: {
      ...(existingEditorial as JourneyEditorialWorkflowState),
      workflow_version: 1,
      canonical_source_language: 'en',
      source_hash: sourceHash,
      source_updated_at: nowIso,
      source_revision: sourceRevision,
      highest_stage: highestStage,
      cross_language_checks: crossLanguageChecks,
      publishing_safety_checks: publishingSafetyChecks,
      language_states: languageStates,
      drift_flags: Array.from(driftFlags),
    },
  };
}

function getPublishedSafetyError(metadata: JourneyLessonMetadata, translationStatus: JourneyTranslationStatusMap): string | null {
  const editorial = metadata.shared_metadata?.editorial;
  const urStage = toEditorialStage(translationStatus.ur);
  const urState = editorial?.language_states?.ur;

  const missingPublishingSafety = PUBLISHING_SAFETY_CHECKS.filter(
    (item) => !editorial?.publishing_safety_checks?.[item.id]
  );
  if (missingPublishingSafety.length > 0) {
    return `Complete publishing safety check: ${missingPublishingSafety[0].label}`;
  }

  if (urStage === 'draft_localized' || urStage === 'emotionally_reviewed') {
    return 'Urdu localization is not QA approved yet. Keep as draft or finish review.';
  }

  if (isStageAtLeast(urStage, 'emotionally_reviewed')) {
    const missingEmotionalReview = EMOTIONAL_LOCALIZATION_REVIEW_CHECKLIST.filter(
      (item) => !urState?.emotional_review?.[item.id]
    );
    if (missingEmotionalReview.length > 0) {
      return `Complete Urdu emotional review: ${missingEmotionalReview[0].label}`;
    }
  }

  if (isStageAtLeast(urStage, 'qa_approved')) {
    const missingQaReview = LOCALIZATION_QA_REVIEW_CHECKLIST.filter(
      (item) => !urState?.qa_review?.[item.id]
    );
    if (missingQaReview.length > 0) {
      return `Complete Urdu QA review: ${missingQaReview[0].label}`;
    }

    const missingConsistency = CROSS_LANGUAGE_CONSISTENCY_CHECKS.filter(
      (item) => !editorial?.cross_language_checks?.[item.id]
    );
    if (missingConsistency.length > 0) {
      return `Complete cross-language consistency check: ${missingConsistency[0].label}`;
    }
  }

  return null;
}

export async function saveLesson(
  lessonData: LessonWithBlocks,
  userId: string
): Promise<{ success: boolean; lessonId?: string; error?: string }> {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    
    const isAdmin = adminEmails.length > 0 
      ? adminEmails.includes(user.email?.toLowerCase() || '')
      : false;

    if (!isAdmin) {
      return { success: false, error: 'Not authorized' };
    }

    const { metadata, blocks } = lessonData;

    const hasUrduContent =
      hasLocalizedMetadataContent(metadata.localized_content, 'ur') ||
      hasLocalizedBlockContent(blocks, 'ur');

    const normalizedStatus = normalizeTranslationStages(metadata.translation_status, {
      hasContentByLanguage: {
        en: true,
        ur: hasUrduContent,
      },
      isPublished: metadata.is_published,
    });

    if (metadata.is_published) {
      const qa = metadata.emotional_qa || {};
      const missingQa = EMOTIONAL_QA_CHECKLIST.filter((item) => !qa[item.id]);

      if (missingQa.length > 0) {
        return {
          success: false,
          error: `Complete emotional QA before publishing: ${missingQa[0].label}`,
        };
      }

      if (!isCanonicalAuthoringDay(metadata.day_number)) {
        const templateValidation = validateDayTemplateContract(metadata.day_number, blocks);
        if (!templateValidation.valid && templateValidation.required) {
          const firstMissing = templateValidation.missingSections[0];
          return {
            success: false,
            error: `Day template missing section: ${firstMissing.title}`,
          };
        }
      } else {
        const canonicalQa = analyzeCanonicalJourneyDraft({
          canonical: metadata.shared_metadata?.canonical_journey,
          translationStatus: normalizedStatus,
          enforceUrduReadiness: true,
        });
        const critical = canonicalQa.issues.find((issue) => issue.severity === 'critical');
        const warning = canonicalQa.issues.find((issue) => issue.severity === 'warning');
        if (critical) {
          return {
            success: false,
            error: `Canonical publish check: ${critical.title}`,
          };
        }

        if (warning) {
          return {
            success: false,
            error: `Canonical publish check: ${warning.title}`,
          };
        }
      }

      const publishingSafetyError = getPublishedSafetyError(
        {
          ...metadata,
          translation_status: normalizedStatus,
        },
        normalizedStatus
      );

      if (publishingSafetyError) {
        return {
          success: false,
          error: publishingSafetyError,
        };
      }
    }

    let nextContentVersion = metadata.shared_metadata?.content_version || 1;

    if (metadata.id) {
      const { data: existingLesson, error: existingLessonError } = await supabase
        .from('journey_lessons')
        .select('shared_metadata')
        .eq('id', metadata.id)
        .single();

      if (existingLessonError) {
        return { success: false, error: existingLessonError.message };
      }

      const currentVersion =
        ((existingLesson?.shared_metadata as JourneySharedMetadata | null)?.content_version as number | undefined) ||
        1;
      const incomingVersion = metadata.shared_metadata?.content_version || currentVersion;

      if (incomingVersion < currentVersion) {
        return {
          success: false,
          error: 'This lesson was updated elsewhere. Please refresh before saving.',
        };
      }

      nextContentVersion = currentVersion + 1;
    }

    const normalizedSharedMetadata = normalizeSharedMetadata(
      {
        ...metadata,
        translation_status: normalizedStatus,
      },
      blocks,
      normalizedStatus,
      nextContentVersion,
      user.id
    );

    const lessonPayload: Record<string, unknown> = {
      day_number: metadata.day_number,
      title: metadata.title,
      subtitle: metadata.subtitle || null,
      topic: metadata.topic,
      description: metadata.description || null,
      estimated_minutes: metadata.estimated_minutes,
      is_published: metadata.is_published,
      localized_content: metadata.localized_content || null,
      translation_status: normalizedStatus,
      shared_metadata: normalizedSharedMetadata,
      updated_at: new Date().toISOString(),
    };

    let lessonId = metadata.id;

    if (lessonId) {
      await supabase
        .from('journey_lessons')
        .update(lessonPayload)
        .eq('id', lessonId);
    } else {
      lessonPayload.created_by = userId;
      lessonPayload.created_at = new Date().toISOString();
      
      const { data: newLesson, error: insertError } = await supabase
        .from('journey_lessons')
        .insert(lessonPayload)
        .select('id')
        .single();

      if (insertError) {
        return { success: false, error: insertError.message };
      }
      lessonId = newLesson.id;
    }

    if (blocks.length > 0) {
      await supabase
        .from('journey_lesson_blocks')
        .delete()
        .eq('lesson_id', lessonId);

      const blocksPayload = blocks.map((block: LessonBlock, index: number) => ({
        lesson_id: lessonId,
        order_index: index,
        block_type: block.block_type,
        content: block.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: blocksError } = await supabase
        .from('journey_lesson_blocks')
        .insert(blocksPayload);

      if (blocksError) {
        return { success: false, error: blocksError.message };
      }

      await supabase
        .from('journey_lessons')
        .update({
          translation_status: normalizedStatus,
          shared_metadata: normalizedSharedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lessonId);
    }

    revalidatePath('/admin/journey');
    revalidatePath('/journey');
    journeyCache.invalidatePattern('journey:');
    
    return { success: true, lessonId };
  } catch (error) {
    console.error('Error saving lesson:', error);
    return { success: false, error: 'Failed to save lesson' };
  }
}

export async function getLessonForEditing(lessonId: string): Promise<LessonWithBlocks | null> {
  try {
    const supabase = await supabaseServer();
    
    const { data: lesson, error } = await supabase
      .from('journey_lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (error || !lesson) {
      return null;
    }

    const { data: blocks, error: blocksError } = await supabase
      .from('journey_lesson_blocks')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index', { ascending: true });

    if (blocksError) {
      console.error('Error fetching blocks:', blocksError);
    }

      return {
        metadata: {
          id: lesson.id,
          day_number: lesson.day_number,
          title: lesson.title,
          subtitle: lesson.subtitle || '',
          topic: lesson.topic,
          description: lesson.description || '',
          estimated_minutes: lesson.estimated_minutes,
          is_published: lesson.is_published,
          emotional_qa: {
            ...Object.fromEntries(EMOTIONAL_QA_CHECKLIST.map((item) => [item.id, false])),
            ...((lesson.shared_metadata as { qa_status?: Record<string, boolean> } | null)?.qa_status || {}),
          },
          localized_content: (lesson.localized_content || {}) as Record<string, unknown>,
          translation_status: normalizeTranslationStages(
            (lesson.translation_status || {}) as JourneyTranslationStatusMap,
            {
              hasContentByLanguage: {
                en: true,
                ur:
                  hasLocalizedMetadataContent(lesson.localized_content || {}, 'ur') ||
                  hasLocalizedBlockContent((blocks || []) as LessonBlock[], 'ur'),
              },
              isPublished: lesson.is_published,
            }
          ),
          shared_metadata: (lesson.shared_metadata || {}) as Record<string, unknown>,
        },
        blocks: blocks || [],
      };
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return null;
  }
}

export async function saveCanonicalLesson(
  metadata: JourneyLessonMetadata,
  userId: string
): Promise<{ success: boolean; lessonId?: string; error?: string }> {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const isAdmin = adminEmails.length > 0
      ? adminEmails.includes(user.email?.toLowerCase() || '')
      : false;
    if (!isAdmin) return { success: false, error: 'Not authorized' };

    const now = new Date().toISOString();
    let nextContentVersion = metadata.shared_metadata?.content_version || 1;

    if (metadata.id) {
      const { data: existing } = await supabase
        .from('journey_lessons').select('shared_metadata').eq('id', metadata.id).single();
      const currentVersion = ((existing?.shared_metadata as JourneySharedMetadata | null)?.content_version as number) || 1;
      if ((metadata.shared_metadata?.content_version || 1) < currentVersion) {
        return { success: false, error: 'This lesson was updated elsewhere. Please refresh before saving.' };
      }
      nextContentVersion = currentVersion + 1;
    }

    const lessonPayload: Record<string, unknown> = {
      day_number: metadata.day_number,
      title: metadata.title,
      subtitle: metadata.subtitle || null,
      topic: metadata.topic || '',
      estimated_minutes: metadata.estimated_minutes,
      is_published: metadata.is_published,
      localized_content: metadata.localized_content || null,
      translation_status: metadata.translation_status || { en: 'qa_approved', ur: 'untranslated' },
      shared_metadata: {
        ...(metadata.shared_metadata || {}),
        content_version: nextContentVersion,
      },
      updated_at: now,
    };

    let lessonId = metadata.id;

    if (lessonId) {
      await supabase.from('journey_lessons').update(lessonPayload).eq('id', lessonId);
    } else {
      lessonPayload.created_by = userId;
      lessonPayload.created_at = now;
      const { data: newLesson, error: insertError } = await supabase
        .from('journey_lessons').insert(lessonPayload).select('id').single();
      if (insertError) return { success: false, error: insertError.message };
      lessonId = newLesson.id;
    }

    revalidatePath('/admin/journey');
    revalidatePath('/journey');
    journeyCache.invalidatePattern('journey:');
    return { success: true, lessonId };
  } catch (error) {
    console.error('Error saving canonical lesson:', error);
    return { success: false, error: 'Failed to save lesson' };
  }
}

export async function getLatestDayNumber(): Promise<number> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('journey_lessons')
    .select('day_number')
    .order('day_number', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return 1;
  }
  return data.day_number + 1;
}
