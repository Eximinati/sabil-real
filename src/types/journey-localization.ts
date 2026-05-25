import type { LanguageCode } from '@/lib/i18n/config';

export type JourneyEditorialStage =
  | 'untranslated'
  | 'draft_localized'
  | 'emotionally_reviewed'
  | 'qa_approved'
  | 'published';

export type JourneyTranslationStatus =
  | 'ready'
  | 'in_progress'
  | 'planned'
  | 'missing'
  | JourneyEditorialStage;

export type JourneyTranslationStatusMap = Partial<Record<LanguageCode, JourneyTranslationStatus>>;

export interface JourneyLocalizedLessonFields {
  title?: string;
  subtitle?: string | null;
  topic?: string;
  description?: string | null;
  lesson_text?: string | null;
  reflection_prompt?: string | null;
}

export type JourneyLocalizedContentMap = Partial<Record<LanguageCode, JourneyLocalizedLessonFields>>;

export interface JourneyLanguageEditorialState {
  stage?: JourneyEditorialStage;
  emotional_review?: Record<string, boolean>;
  qa_review?: Record<string, boolean>;
  synced_source_hash?: string;
  content_hash?: string;
  updated_at?: string;
  updated_by?: string;
  reviewer_note?: string;
}

export interface JourneyEditorialWorkflowState {
  workflow_version?: number;
  canonical_source_language?: LanguageCode;
  source_hash?: string;
  source_updated_at?: string;
  source_revision?: string;
  highest_stage?: JourneyEditorialStage;
  cross_language_checks?: Record<string, boolean>;
  publishing_safety_checks?: Record<string, boolean>;
  language_states?: Partial<Record<LanguageCode, JourneyLanguageEditorialState>>;
  drift_flags?: string[];
}

export const JOURNEY_EDITORIAL_STAGE_VALUES: JourneyEditorialStage[] = [
  'untranslated',
  'draft_localized',
  'emotionally_reviewed',
  'qa_approved',
  'published',
];

export interface JourneySharedMetadata {
  lesson_order?: number;
  arc_identity?: string;
  week_chapter?: string;
  emotional_note?: string;
  seerah_references?: string[];
  estimated_minutes?: number;
  qa_status?: Record<string, boolean>;
  content_version?: number;
  source_revision?: string;
  editorial?: JourneyEditorialWorkflowState;
}

export interface JourneyLanguageContext {
  requested: LanguageCode;
  resolved: LanguageCode;
  fallbackUsed: boolean;
  requestedStatus: JourneyTranslationStatus;
}
