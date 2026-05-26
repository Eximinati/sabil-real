import { DEFAULT_LANGUAGE, type LanguageCode } from '@/lib/i18n/config';
import type { JourneyLesson, UserPreferences } from '@/lib/journey';
import type {
  CanonicalJourneySectionId,
  CanonicalQuranRange,
  CanonicalTafsirFallbackBehavior,
  CanonicalTafsirRevealMode,
} from '@/types/journey-localization';
import {
  buildVerseKeysFromQuranRange,
  inferQuranRangeFromVerseKeys,
  resolveCanonicalTafsirForRuntime,
  sanitizeQuranRange,
  sanitizeVerseKeys,
  toCanonicalVerseReferenceLabel,
} from './canonical-sacred';

export interface CanonicalJourneySectionView {
  id: CanonicalJourneySectionId;
  title: string;
  intro?: string;
   quranRangeLabel?: string;
  verseKeys?: string[];
  hadithCollection?: string | null;
  hadithNumber?: number | null;
  hadithSource?: string | null;
  bodyText?: string;
}

export interface CanonicalJourneyPlan {
  isCanonical: boolean;
  sections: CanonicalJourneySectionView[];
  quranRange?: CanonicalQuranRange | null;
  quranRangeLabel?: string;
  verseKeys: string[];
  hadithCollection?: string | null;
  hadithNumber?: number | null;
  hadithSource?: string | null;
  defaultTafsirId?: number;
  resolvedTafsirId?: number | null;
  tafsir: {
    enabled: boolean;
    revealMode: CanonicalTafsirRevealMode;
    fallbackBehavior: CanonicalTafsirFallbackBehavior;
    scholarIds: number[];
    fallbackUsed: boolean;
  };
  structureVersion?: number;
  weekIdentity?: string;
  emotionalNote?: string;
  publishingState?: 'draft' | 'review' | 'published';
  languageContext: {
    requested: LanguageCode;
    resolved: LanguageCode;
    fallbackUsed: boolean;
  };
}

const SECTION_LABELS: Record<CanonicalJourneySectionId, string> = {
  'opening-reflection': 'Opening reflection',
  'seerah-moment': 'Seerah moment',
  'quran-reflection': 'Quran reflection',
  'tafsir-insight': 'Tafsir insight',
  'hadith-connection': 'Hadith connection',
  'reflection-prompt': 'Reflection prompt',
  'tiny-action': 'Tiny action',
  'closing-dua': 'Closing dua',
};

const SECTION_ORDER: CanonicalJourneySectionId[] = [
  'opening-reflection',
  'seerah-moment',
  'quran-reflection',
  'tafsir-insight',
  'hadith-connection',
  'reflection-prompt',
  'tiny-action',
  'closing-dua',
];

type SectionAliasesByLanguage = Record<LanguageCode, string[]>;

function parseMarkdownSections(markdown: string): Map<string, string> {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const sections = new Map<string, string>();
  let currentHeading = '';
  let currentLines: string[] = [];

  const flush = () => {
    if (!currentHeading) {
      return;
    }

    const normalized = currentHeading
      .toLowerCase()
      .replace(/[^a-z0-9\s\u0600-\u06FF]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (normalized) {
      sections.set(normalized, currentLines.join('\n').trim());
    }
  };

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      flush();
      currentHeading = headingMatch[1];
      currentLines = [];
      continue;
    }

    if (!currentHeading) {
      continue;
    }

    currentLines.push(line);
  }

  flush();
  return sections;
}

function resolveSectionBody(
  sections: Map<string, string>,
  aliases: string[]
): string | undefined {
  for (const alias of aliases) {
    const normalized = alias
      .toLowerCase()
      .replace(/[^a-z0-9\s\u0600-\u06FF]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const body = sections.get(normalized);
    if (body && body.length > 0) {
      return body;
    }
  }

  return undefined;
}

function firstParagraph(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const paragraph = value
    .split('\n\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!paragraph) {
    return undefined;
  }

  return paragraph
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSectionAliases(): Record<CanonicalJourneySectionId, SectionAliasesByLanguage> {
  return {
    'opening-reflection': {
      en: ['opening reflection'],
      ur: ['ابتدائی تامل', 'ابتدائی غور', 'آغازی تامل'],
    },
    'seerah-moment': {
      en: ['seerah moment', 'a seerah moment'],
      ur: ['سیرت کا لمحہ', 'سیرت کا ایک لمحہ', 'نبوی لمحہ'],
    },
    'quran-reflection': {
      en: ['quran reflection', 'quran to sit with today', 'quran for today'],
      ur: ['قرآنی تامل', 'آج کے لیے قرآن', 'قرآن کے ساتھ تامل'],
    },
    'tafsir-insight': {
      en: ['tafsir support', 'tafsir insight', 'sit with what this means'],
      ur: ['تفسیری بصیرت', 'تفسیری رہنمائی', 'اس معنی کے ساتھ ٹھہریں'],
    },
    'hadith-connection': {
      en: ['hadith connection', 'a prophetic reminder', 'related hadith'],
      ur: ['حدیثی ربط', 'نبوی یاددہانی', 'متعلقہ حدیث'],
    },
    'reflection-prompt': {
      en: ['private reflection', 'reflection for the heart'],
      ur: ['تاملی سوال', 'دل کا تامل', 'نجی تامل'],
    },
    'tiny-action': {
      en: ['tiny action', 'a tiny action for tonight', 'tiny action for tonight'],
      ur: ['چھوٹا عمل', 'آج کا چھوٹا قدم', 'عملی قدم'],
    },
    'closing-dua': {
      en: ['closing moment', 'closing dua'],
      ur: ['اختتامی دعا', 'اختتامی لمحہ', 'اختتام'],
    },
  };
}

function getSectionFromCanonicalMeta(
  lesson: JourneyLesson,
  sectionId: CanonicalJourneySectionId
) {
  return lesson.shared_metadata?.canonical_journey?.sections?.[sectionId];
}

function resolveVerseKeys(lesson: JourneyLesson): string[] {
  const fromRange = buildVerseKeysFromQuranRange(resolveQuranRange(lesson));
  if (fromRange.length > 0) {
    return fromRange;
  }

  const sectionKeys =
    lesson.shared_metadata?.canonical_journey?.sections?.['quran-reflection']?.sacred_refs?.verse_keys || [];
  if (sectionKeys.length > 0) {
    return sanitizeVerseKeys(sectionKeys);
  }

  const metaKeys =
    lesson.shared_metadata?.canonical_journey?.sacred_source_refs?.verse_keys || [];
  if (metaKeys.length > 0) {
    return sanitizeVerseKeys(metaKeys);
  }

  return sanitizeVerseKeys(lesson.verse_keys || []);
}

function resolveQuranRange(lesson: JourneyLesson): CanonicalQuranRange | null {
  const sectionRange =
    lesson.shared_metadata?.canonical_journey?.sections?.['quran-reflection']?.sacred_refs?.quran_range;
  const rootRange = lesson.shared_metadata?.canonical_journey?.sacred_source_refs?.quran_range;

  const explicitRange = sanitizeQuranRange(sectionRange || rootRange);
  if (explicitRange) {
    return explicitRange;
  }

  const sectionVerseKeys =
    lesson.shared_metadata?.canonical_journey?.sections?.['quran-reflection']?.sacred_refs?.verse_keys;
  const rootVerseKeys = lesson.shared_metadata?.canonical_journey?.sacred_source_refs?.verse_keys;
  const inferred = inferQuranRangeFromVerseKeys(
    sectionVerseKeys && sectionVerseKeys.length > 0
      ? sectionVerseKeys
      : rootVerseKeys && rootVerseKeys.length > 0
        ? rootVerseKeys
        : lesson.verse_keys
  );

  return inferred;
}

function resolveHadithRef(lesson: JourneyLesson): {
  collection?: string | null;
  number?: number | null;
  source?: string | null;
} {
  const sectionRefs =
    lesson.shared_metadata?.canonical_journey?.sections?.['hadith-connection']?.sacred_refs;
  const refs = lesson.shared_metadata?.canonical_journey?.sacred_source_refs;

  return {
    collection:
      sectionRefs?.hadith_collection || refs?.hadith_collection || lesson.hadith_collection || null,
    number: sectionRefs?.hadith_number || refs?.hadith_number || lesson.hadith_number || null,
    source: sectionRefs?.hadith_source || refs?.hadith_source || lesson.hadith_source || null,
  };
}

function uniqueLanguageCandidates(...languages: Array<LanguageCode | undefined>): LanguageCode[] {
  const seen = new Set<LanguageCode>();
  const ordered: LanguageCode[] = [];

  for (const language of languages) {
    if (!language || seen.has(language)) {
      continue;
    }

    seen.add(language);
    ordered.push(language);
  }

  return ordered;
}

function resolveSectionBodyFromMetadata(
  lesson: JourneyLesson,
  sectionId: CanonicalJourneySectionId,
  languageCandidates: LanguageCode[]
): string | undefined {
  const section = lesson.shared_metadata?.canonical_journey?.sections?.[sectionId];
  if (!section?.content) {
    return undefined;
  }

  for (const language of languageCandidates) {
    const content = section.content[language];
    if (typeof content === 'string' && content.trim().length > 0) {
      return content.trim();
    }
  }

  return undefined;
}

export function buildCanonicalJourneyPlan(
  lesson: JourneyLesson,
  options: {
    language: LanguageCode;
    markdownByLanguage?: Partial<Record<LanguageCode, string>>;
    preferences?: UserPreferences;
  }
): CanonicalJourneyPlan {
  const requestedLanguage = options.language;
  const resolvedLanguage = lesson.language_context?.resolved || requestedLanguage;
  const fallbackUsed =
    lesson.language_context?.fallbackUsed ||
    (requestedLanguage !== resolvedLanguage && requestedLanguage !== DEFAULT_LANGUAGE);
  const markdownByLanguage = options.markdownByLanguage || {};
  const resolvedMarkdown =
    markdownByLanguage[resolvedLanguage] ||
    markdownByLanguage[requestedLanguage] ||
    markdownByLanguage[DEFAULT_LANGUAGE] ||
    '';
  const englishMarkdown = markdownByLanguage[DEFAULT_LANGUAGE] || resolvedMarkdown;

  const sectionsByHeading = parseMarkdownSections(resolvedMarkdown);
  const sectionsByHeadingEnglish =
    englishMarkdown === resolvedMarkdown
      ? sectionsByHeading
      : parseMarkdownSections(englishMarkdown);
  const aliases = buildSectionAliases();
  const languageCandidates = uniqueLanguageCandidates(
    resolvedLanguage,
    requestedLanguage,
    DEFAULT_LANGUAGE
  );
  const quranRange = resolveQuranRange(lesson);
  const verseKeys = resolveVerseKeys(lesson);
  const hadithRef = resolveHadithRef(lesson);
  const canonical = lesson.shared_metadata?.canonical_journey;
  const tafsirConfig = resolveCanonicalTafsirForRuntime({
    settings: canonical?.tafsir,
    legacyDefaultTafsirId:
      canonical?.default_tafsir_id || options.preferences?.tafsir_id || 169,
    userPreferredTafsirId: options.preferences?.tafsir_id,
  });

  const sections: CanonicalJourneySectionView[] = SECTION_ORDER.map((sectionId) => {
    const sectionMeta = getSectionFromCanonicalMeta(lesson, sectionId);
    const aliasSet = aliases[sectionId];
    const prioritizedAliases = Array.from(
      new Set([
        ...(resolvedLanguage === 'ur' ? aliasSet.ur : aliasSet.en),
        ...aliasSet.en,
        ...aliasSet.ur,
      ])
    );
    const bodyFromMetadata = resolveSectionBodyFromMetadata(
      lesson,
      sectionId,
      languageCandidates
    );
    const bodyFromMarkdown = resolveSectionBody(sectionsByHeading, prioritizedAliases);
    const bodyFromEnglish =
      sectionsByHeading === sectionsByHeadingEnglish
        ? undefined
        : resolveSectionBody(sectionsByHeadingEnglish, aliasSet.en);
    const body = bodyFromMetadata || bodyFromMarkdown || bodyFromEnglish;
    const intro = firstParagraph(body);

    return {
      id: sectionId,
      title: sectionMeta?.heading || SECTION_LABELS[sectionId],
      intro,
      bodyText: body,
      ...(sectionId === 'quran-reflection'
        ? {
            verseKeys,
            quranRangeLabel: toCanonicalVerseReferenceLabel(quranRange),
          }
        : {}),
      ...(sectionId === 'hadith-connection'
        ? {
            hadithCollection: hadithRef.collection,
            hadithNumber: hadithRef.number,
            hadithSource: hadithRef.source,
          }
        : {}),
    };
  });

  const canonicalJourney = lesson.shared_metadata?.canonical_journey;

  return {
    isCanonical: Boolean(canonicalJourney?.sections),
    sections,
    quranRange,
    quranRangeLabel: toCanonicalVerseReferenceLabel(quranRange),
    verseKeys,
    hadithCollection: hadithRef.collection,
    hadithNumber: hadithRef.number,
    hadithSource: hadithRef.source,
    defaultTafsirId: tafsirConfig.tafsir_id || tafsirConfig.scholar_ids[0] || 169,
    resolvedTafsirId: tafsirConfig.tafsir_id,
    tafsir: {
      enabled: tafsirConfig.enabled,
      revealMode: tafsirConfig.reveal_mode,
      fallbackBehavior: tafsirConfig.fallback_behavior,
      scholarIds: tafsirConfig.scholar_ids,
      fallbackUsed: tafsirConfig.fallback_used,
    },
    structureVersion: canonicalJourney?.structure_version,
    weekIdentity: canonicalJourney?.week_identity,
    emotionalNote: canonicalJourney?.emotional_note,
    publishingState: canonicalJourney?.publishing_state,
    languageContext: {
      requested: requestedLanguage,
      resolved: resolvedLanguage,
      fallbackUsed,
    },
  };
}
