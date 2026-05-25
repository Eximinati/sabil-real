import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/i18n/config';
import type { LessonBlock } from '@/types/admin-journey';
import type {
  JourneyEditorialStage,
  JourneyLocalizedContentMap,
  JourneyTranslationStatus,
  JourneyTranslationStatusMap,
} from '@/types/journey-localization';

export const JOURNEY_EDITORIAL_STAGE_ORDER: JourneyEditorialStage[] = [
  'untranslated',
  'draft_localized',
  'emotionally_reviewed',
  'qa_approved',
  'published',
];

export const JOURNEY_EDITORIAL_STAGE_LABELS: Record<JourneyEditorialStage, string> = {
  untranslated: 'Untranslated',
  draft_localized: 'Draft Localized',
  emotionally_reviewed: 'Emotionally Reviewed',
  qa_approved: 'QA Approved',
  published: 'Published',
};

export const JOURNEY_EDITORIAL_STAGE_TONES: Record<JourneyEditorialStage, string> = {
  untranslated: 'bg-slate-100 text-slate-700',
  draft_localized: 'bg-amber-100 text-amber-800',
  emotionally_reviewed: 'bg-sky-100 text-sky-800',
  qa_approved: 'bg-emerald-100 text-emerald-800',
  published: 'bg-teal-100 text-teal-800',
};

const LEGACY_STATUS_TO_STAGE: Record<string, JourneyEditorialStage> = {
  missing: 'untranslated',
  planned: 'untranslated',
  in_progress: 'draft_localized',
  ready: 'qa_approved',
};

export const EMOTIONAL_LOCALIZATION_REVIEW_CHECKLIST = [
  { id: 'warmth', label: 'Warmth stays human and close' },
  { id: 'softness', label: 'Softness remains free of pressure or shame' },
  { id: 'readability', label: 'Readability remains light on mobile' },
  { id: 'emotional-equivalence', label: 'Emotional equivalence matches source intent' },
  { id: 'contemplative-pacing', label: 'Contemplative pacing keeps breathing room' },
  { id: 'spiritual-intimacy', label: 'Spiritual intimacy feels sincere and welcoming' },
] as const;

export const LOCALIZATION_QA_REVIEW_CHECKLIST = [
  { id: 'metadata-complete', label: 'Localized metadata fields are complete where required' },
  { id: 'block-coverage', label: 'Localized block content covers key reflective sections' },
  { id: 'seerah-aligned', label: 'Seerah references remain emotionally aligned across languages' },
  { id: 'quran-framing-aligned', label: 'Quran and tafsir framing remains spiritually coherent' },
  { id: 'anti-pattern-check', label: 'No robotic or overly formal localization patterns' },
] as const;

export const CROSS_LANGUAGE_CONSISTENCY_CHECKS = [
  { id: 'arc-identity-aligned', label: 'Arc identity aligns across languages' },
  { id: 'week-identity-aligned', label: 'Week chapter identity stays aligned' },
  { id: 'seerah-progression-aligned', label: 'Seerah progression remains parallel' },
  { id: 'emotional-pacing-aligned', label: 'Emotional pacing remains parallel' },
] as const;

export const PUBLISHING_SAFETY_CHECKS = [
  { id: 'metadata-integrity', label: 'Metadata integrity confirmed' },
  { id: 'section-completeness', label: 'Required day sections are complete' },
  { id: 'emotional-qa', label: 'Emotional QA is complete' },
  { id: 'language-consistency', label: 'Cross-language consistency is confirmed' },
  { id: 'structural-alignment', label: 'Structural alignment is preserved' },
  { id: 'translation-sync', label: 'Localized content is synced with source version' },
] as const;

function hasMeaningfulValue(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasMeaningfulValue(item));
  }

  return value !== null && value !== undefined;
}

export function hasLocalizedMetadataContent(
  localizedContent: JourneyLocalizedContentMap | undefined,
  language: LanguageCode
): boolean {
  const fields = localizedContent?.[language];
  if (!fields) {
    return false;
  }

  return Object.values(fields).some((value) => hasMeaningfulValue(value));
}

export function hasLocalizedBlockContent(blocks: LessonBlock[], language: LanguageCode): boolean {
  return blocks.some((block) => {
    const i18n = (block.content as { i18n?: Record<string, unknown> }).i18n;
    return hasMeaningfulValue(i18n?.[language]);
  });
}

export function toEditorialStage(status: JourneyTranslationStatus | undefined | null): JourneyEditorialStage {
  if (!status) {
    return 'untranslated';
  }

  if (JOURNEY_EDITORIAL_STAGE_ORDER.includes(status as JourneyEditorialStage)) {
    return status as JourneyEditorialStage;
  }

  return LEGACY_STATUS_TO_STAGE[String(status)] || 'untranslated';
}

export function fromEditorialStage(stage: JourneyEditorialStage): JourneyTranslationStatus {
  return stage;
}

export function isStageAtLeast(stage: JourneyEditorialStage, minimum: JourneyEditorialStage): boolean {
  const stageIndex = JOURNEY_EDITORIAL_STAGE_ORDER.indexOf(stage);
  const minimumIndex = JOURNEY_EDITORIAL_STAGE_ORDER.indexOf(minimum);
  return stageIndex >= minimumIndex;
}

export function getEditorialStageLabel(status: JourneyTranslationStatus | undefined | null): string {
  const stage = toEditorialStage(status);
  return JOURNEY_EDITORIAL_STAGE_LABELS[stage];
}

export function isRuntimeReadyStatus(status: JourneyTranslationStatus | undefined | null): boolean {
  return status === 'ready' || status === 'qa_approved' || status === 'published';
}

export function normalizeTranslationStages(
  input: JourneyTranslationStatusMap | undefined,
  options: {
    hasContentByLanguage?: Partial<Record<LanguageCode, boolean>>;
    isPublished?: boolean;
  } = {}
): JourneyTranslationStatusMap {
  const result: JourneyTranslationStatusMap = {};
  const hasContentByLanguage = options.hasContentByLanguage || {};
  const isPublished = options.isPublished === true;

  for (const language of SUPPORTED_LANGUAGES) {
    const raw = input?.[language];
    let stage = toEditorialStage(raw);

    if (language === 'en') {
      stage = isPublished ? 'published' : 'qa_approved';
    } else {
      const hasContent = hasContentByLanguage[language] === true;
      if (!hasContent && stage !== 'published') {
        stage = 'untranslated';
      }
      if (hasContent && stage === 'untranslated') {
        stage = 'draft_localized';
      }
      if (isPublished && (stage === 'qa_approved' || stage === 'published')) {
        stage = 'published';
      }
    }

    result[language] = fromEditorialStage(stage);
  }

  return result;
}

export function getDefaultChecklistMap<T extends readonly { id: string }[]>(
  checklist: T,
  value = false
): Record<T[number]['id'], boolean> {
  return Object.fromEntries(checklist.map((item) => [item.id, value])) as Record<T[number]['id'], boolean>;
}
