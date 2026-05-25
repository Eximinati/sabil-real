import { DEFAULT_LANGUAGE, type LanguageCode } from '@/lib/i18n/config';
import { isRuntimeReadyStatus } from './journey-editorial';
import type {
  JourneyLanguageContext,
  JourneyTranslationStatus,
  JourneyTranslationStatusMap,
} from '@/types/journey-localization';

type LessonLocalizedFields = {
  title: string;
  subtitle: string | null;
  topic: string;
  description: string | null;
  lesson_text: string | null;
  reflection_prompt: string | null;
};

type LessonLocalizedPatch = Partial<LessonLocalizedFields>;

type WithLocalizedContent = {
  localized_content?: Record<string, LessonLocalizedPatch> | null;
  translation_status?: JourneyTranslationStatusMap | null;
};

const LOCALIZABLE_FIELDS: Array<keyof LessonLocalizedFields> = [
  'title',
  'subtitle',
  'topic',
  'description',
  'lesson_text',
  'reflection_prompt',
];

const NULLABLE_FIELDS: Array<keyof LessonLocalizedFields> = [
  'subtitle',
  'description',
  'lesson_text',
  'reflection_prompt',
];

function isNullableField(field: keyof LessonLocalizedFields): field is (typeof NULLABLE_FIELDS)[number] {
  return NULLABLE_FIELDS.includes(field);
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function localizeLesson<T extends WithLocalizedContent & LessonLocalizedFields>(
  lesson: T,
  language: LanguageCode = DEFAULT_LANGUAGE
): T {
  if (language === DEFAULT_LANGUAGE || !lesson.localized_content) {
    return lesson;
  }

  const translation = lesson.localized_content[language];
  if (!translation) {
    return lesson;
  }

  const localized = { ...lesson };
  const localizedFields = localized as Record<keyof LessonLocalizedFields, string | null>;
  for (const field of LOCALIZABLE_FIELDS) {
    const nextValue = translation[field];
    if (nextValue === null && isNullableField(field)) {
      localizedFields[field] = null;
      continue;
    }
    if (isNonEmpty(nextValue)) {
      localizedFields[field] = nextValue;
    }
  }

  return localized;
}

function getTranslationStatusValue(
  statuses: JourneyTranslationStatusMap | null | undefined,
  language: LanguageCode
): JourneyTranslationStatus {
  const value = statuses?.[language];
  if (
    value === 'ready' ||
    value === 'in_progress' ||
    value === 'planned' ||
    value === 'missing' ||
    value === 'untranslated' ||
    value === 'draft_localized' ||
    value === 'emotionally_reviewed' ||
    value === 'qa_approved' ||
    value === 'published'
  ) {
    return value;
  }
  return language === DEFAULT_LANGUAGE ? 'ready' : 'missing';
}

function hasLocalizedFields(translation: LessonLocalizedPatch | undefined): boolean {
  if (!translation) {
    return false;
  }

  return LOCALIZABLE_FIELDS.some((field) => {
    const value = translation[field];
    return value === null || isNonEmpty(value);
  });
}

export function resolveLessonLanguageContext<T extends WithLocalizedContent>(
  lesson: T,
  requestedLanguage: LanguageCode = DEFAULT_LANGUAGE
): JourneyLanguageContext {
  const requestedStatus = getTranslationStatusValue(lesson.translation_status, requestedLanguage);

  if (requestedLanguage === DEFAULT_LANGUAGE) {
    return {
      requested: requestedLanguage,
      resolved: DEFAULT_LANGUAGE,
      fallbackUsed: false,
      requestedStatus,
    };
  }

  const requestedContent = lesson.localized_content?.[requestedLanguage] as LessonLocalizedPatch | undefined;
  const hasRequestedContent = hasLocalizedFields(requestedContent);
  const hasExplicitStatus = lesson.translation_status?.[requestedLanguage] !== undefined;
  const canUseRequested = hasExplicitStatus
    ? isRuntimeReadyStatus(requestedStatus)
    : hasRequestedContent;

  return {
    requested: requestedLanguage,
    resolved: canUseRequested ? requestedLanguage : DEFAULT_LANGUAGE,
    fallbackUsed: !canUseRequested,
    requestedStatus,
  };
}

export function localizeLessonCollection<T extends WithLocalizedContent & LessonLocalizedFields>(
  lessons: T[],
  language: LanguageCode = DEFAULT_LANGUAGE
): T[] {
  if (language === DEFAULT_LANGUAGE) {
    return lessons;
  }
  return lessons.map((lesson) => localizeLesson(lesson, language));
}

export function localizeBlockContent(
  content: Record<string, unknown>,
  language: LanguageCode = DEFAULT_LANGUAGE
): Record<string, unknown> {
  const withLocales = content as Record<string, unknown> & {
    i18n?: Record<string, Record<string, unknown>>;
  };

  const localized = withLocales.i18n?.[language];
  if (!localized) {
    return content;
  }

  return {
    ...content,
    ...localized,
  };
}
