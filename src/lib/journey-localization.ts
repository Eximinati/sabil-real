import { DEFAULT_LANGUAGE, type LanguageCode } from '@/lib/i18n/config';

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
