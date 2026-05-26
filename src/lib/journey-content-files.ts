import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/i18n/config';
import { getDayIdentity, getWeekForDay, WEEKLY_EMOTIONAL_ARCS } from './journey-emotional-arc';
import {
  buildVerseKeysFromQuranRange,
  canonicalHadithSourceLabel,
  DEFAULT_HADITH_COLLECTION,
  DEFAULT_HADITH_NUMBER,
  DEFAULT_QURAN_RANGE,
  normalizeCanonicalTafsirSettings,
  sanitizeQuranRange,
} from './canonical-sacred';
import type {
  CanonicalJourneySectionId,
  CanonicalJourneySectionLanguageState,
  JourneySharedMetadata,
  JourneyTranslationStatusMap,
} from '@/types/journey-localization';
import {
  JOURNEY_EDITORIAL_STAGE_ORDER,
  isRuntimeReadyStatus,
  normalizeTranslationStages,
  toEditorialStage,
} from './journey-editorial';

export interface JourneyDayMetaFile {
  dayNumber?: number;
  lessonOrder?: number;
  arcIdentity?: string;
  weekChapter?: string;
  emotionalNote?: string;
  seerahReferences?: string[];
  estimatedMinutes?: number;
  qaStatus?: Record<string, boolean>;
  translationStatus?: JourneyTranslationStatusMap;
  contentVersion?: number;
  sourceRevision?: string;
  editorial?: JourneySharedMetadata['editorial'];
  canonicalJourney?: {
    structureVersion?: number;
    weekIdentity?: string;
    emotionalNote?: string;
    publishingState?: 'draft' | 'review' | 'published';
    defaultTafsirId?: number;
    sacredSourceRefs?: {
      quranRange?: {
        surahId?: number;
        ayahStart?: number;
        ayahEnd?: number;
      };
      verseKeys?: string[];
      hadithCollection?: string;
      hadithNumber?: number;
      hadithSource?: string;
    };
    tafsir?: {
      enabled?: boolean;
      defaultTafsirId?: number;
      scholarIds?: number[];
      fallbackBehavior?: 'user-preferred' | 'default-only' | 'hide-if-unavailable';
      revealMode?: 'condensed' | 'full';
    };
    sections?: Partial<
      Record<
        CanonicalJourneySectionId,
        {
          heading?: string;
          emotionalGoal?: string;
          required?: boolean;
          present?: Partial<Record<LanguageCode, boolean>>;
          languageState?: Partial<Record<LanguageCode, CanonicalJourneySectionLanguageState>>;
          content?: Partial<Record<LanguageCode, string>>;
          sacredRefs?: {
            quranRange?: {
              surahId?: number;
              ayahStart?: number;
              ayahEnd?: number;
            };
            verseKeys?: string[];
            hadithCollection?: string;
            hadithNumber?: number;
            hadithSource?: string;
            seerahReference?: string;
          };
        }
      >
    >;
  };
}

function toCanonicalQuranRangeFromMeta(
  range:
    | {
        surahId?: number;
        ayahStart?: number;
        ayahEnd?: number;
      }
    | undefined
) {
  if (!range) {
    return null;
  }

  return sanitizeQuranRange({
    surah_id: range.surahId,
    ayah_start: range.ayahStart,
    ayah_end: range.ayahEnd,
  });
}

export interface JourneyDayBundle {
  dayNumber: number;
  title: string;
  description: string;
  reflectionPrompt: string;
  localized_content: Record<string, Record<string, string>> | null;
  markdownByLanguage: Partial<Record<LanguageCode, string>>;
  metadata: JourneySharedMetadata;
  translationStatus: JourneyTranslationStatusMap;
  source: 'structured' | 'legacy';
}

function toTitleCaseDay(value: number): string {
  return `day-${String(value).padStart(2, '0')}`;
}

type CanonicalSectionConfig = {
  id: CanonicalJourneySectionId;
  heading: string;
  aliases: string[];
  urduAliases: string[];
  emotionalGoal: string;
  required: boolean;
};

const CANONICAL_SECTION_CONFIG: CanonicalSectionConfig[] = [
  {
    id: 'opening-reflection',
    heading: 'Opening reflection',
    aliases: ['opening reflection', 'opening'],
    urduAliases: ['ابتدائی تامل', 'ابتدائی غور', 'آغازی تامل'],
    emotionalGoal: 'Open heart with gentle emotional entry.',
    required: true,
  },
  {
    id: 'seerah-moment',
    heading: 'Seerah moment',
    aliases: ['seerah moment', 'a seerah moment', 'prophetic moment'],
    urduAliases: ['سیرت کا لمحہ', 'سیرت کا ایک لمحہ', 'نبوی لمحہ'],
    emotionalGoal: 'Offer human Prophetic companionship.',
    required: true,
  },
  {
    id: 'quran-reflection',
    heading: 'Quran reflection',
    aliases: ['quran reflection', 'quran to sit with today', 'quran for today'],
    urduAliases: ['قرآنی تامل', 'آج کے لیے قرآن', 'قرآن کے ساتھ تامل'],
    emotionalGoal: 'Center day on revealed guidance.',
    required: true,
  },
  {
    id: 'tafsir-insight',
    heading: 'Tafsir insight',
    aliases: ['tafsir support', 'tafsir insight', 'sit with what this means'],
    urduAliases: ['تفسیری بصیرت', 'تفسیری رہنمائی', 'اس معنی کے ساتھ ٹھہریں'],
    emotionalGoal: 'Add optional scholar understanding with softness.',
    required: false,
  },
  {
    id: 'hadith-connection',
    heading: 'Hadith connection',
    aliases: ['hadith connection', 'a prophetic reminder', 'related hadith'],
    urduAliases: ['حدیثی ربط', 'نبوی یاددہانی', 'متعلقہ حدیث'],
    emotionalGoal: 'Reinforce Quran guidance with Prophetic wisdom.',
    required: true,
  },
  {
    id: 'reflection-prompt',
    heading: 'Reflection prompt',
    aliases: ['private reflection', 'reflection for the heart', 'reflection'],
    urduAliases: ['تاملی سوال', 'دل کا تامل', 'نجی تامل'],
    emotionalGoal: 'Invite private sincerity and internalization.',
    required: true,
  },
  {
    id: 'tiny-action',
    heading: 'Tiny action',
    aliases: ['tiny action', 'tiny action for tonight', 'practical step'],
    urduAliases: ['چھوٹا عمل', 'آج کا چھوٹا قدم', 'عملی قدم'],
    emotionalGoal: 'Translate meaning into one gentle lived step.',
    required: true,
  },
  {
    id: 'closing-dua',
    heading: 'Closing dua',
    aliases: ['closing moment', 'closing dua', 'closing'],
    urduAliases: ['اختتامی دعا', 'اختتامی لمحہ', 'اختتام'],
    emotionalGoal: 'End with spiritual closure and calm return cue.',
    required: true,
  },
];

function normalizeHeadingLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s\u0600-\u06FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectMarkdownHeadingMap(markdown: string): Map<string, number> {
  const map = new Map<string, number>();
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^##\s+(.+)$/);
    if (!match) {
      continue;
    }

    const normalized = normalizeHeadingLabel(match[1]);
    if (!normalized) {
      continue;
    }

    map.set(normalized, index);
  }

  return map;
}

function getSectionBody(markdown: string, aliases: string[]): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const headingMap = collectMarkdownHeadingMap(markdown);

  const matchAlias = aliases
    .map((alias) => normalizeHeadingLabel(alias))
    .find((alias) => headingMap.has(alias));

  if (!matchAlias) {
    return '';
  }

  const startIndex = headingMap.get(matchAlias);
  if (startIndex === undefined) {
    return '';
  }

  const sectionLines: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) {
      break;
    }
    sectionLines.push(lines[index]);
  }

  return sectionLines.join('\n').trim();
}

function hasSectionContent(markdown: string, aliases: string[]): boolean {
  const body = getSectionBody(markdown, aliases);
  if (body.length > 0) {
    return true;
  }

  const headingMap = collectMarkdownHeadingMap(markdown);
  return aliases
    .map((alias) => normalizeHeadingLabel(alias))
    .some((alias) => headingMap.has(alias));
}

function resolveSectionContentByLanguage(
  markdownByLanguage: Partial<Record<LanguageCode, string>>,
  aliases: string[],
  urduAliases: string[]
): Partial<Record<LanguageCode, string>> {
  const contentByLanguage: Partial<Record<LanguageCode, string>> = {};

  const englishBody = getSectionBody(markdownByLanguage.en || '', aliases).trim();
  if (englishBody.length > 0) {
    contentByLanguage.en = englishBody;
  }

  const urduMarkdown = markdownByLanguage.ur || '';
  if (urduMarkdown.length > 0) {
    const urduBody = getSectionBody(urduMarkdown, [...aliases, ...urduAliases]).trim();
    if (urduBody.length > 0) {
      contentByLanguage.ur = urduBody;
    }
  }

  return contentByLanguage;
}

function parseVerseKeysFromSection(text: string): string[] {
  const matches = text.match(/\b\d{1,3}:\d{1,3}\b/g) || [];
  return Array.from(new Set(matches));
}

function parseHadithReference(text: string): {
  collection?: string;
  number?: number;
  source?: string;
} {
  const normalized = text
    .toLowerCase()
    .replace(/sahih\s+al-/g, '')
    .replace(/sahih\s+/g, '')
    .replace(/sunan\s+/g, '');

  const match = normalized.match(/\b(bukhari|muslim|abudawud|abu\s+dawud|tirmidhi|nasai|ibn\s+majah|malik)\b[^\d]{0,32}(\d{1,5})/i);
  if (!match) {
    return {};
  }

  const alias = match[1].toLowerCase().replace(/\s+/g, '');
  const collectionByAlias: Record<string, string> = {
    bukhari: 'bukhari',
    muslim: 'muslim',
    abudawud: 'abudawud',
    tirmidhi: 'tirmidhi',
    nasai: 'nasai',
    ibnmajah: 'ibnmajah',
    malik: 'malik',
  };

  return {
    collection: collectionByAlias[alias],
    number: parseInt(match[2], 10),
    source: text.trim() || undefined,
  };
}

function parseCanonicalDayTitle(markdown: string): string | undefined {
  const heading = markdown
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('# '));

  if (!heading) {
    return undefined;
  }

  const title = heading.replace(/^#\s*/, '').trim();
  const english = title.match(/^Day\s*\d+\s*[-:]\s*(.+)$/i);
  if (english) {
    return english[1].trim();
  }

  const urdu = title.match(/^دن\s*\d+\s*[-:،]?\s*(.+)$/i);
  if (urdu) {
    return urdu[1].trim();
  }

  return title;
}

function parseSectionIntro(markdown: string, aliases: string[]): string | undefined {
  const body = getSectionBody(markdown, aliases);
  if (!body) {
    return undefined;
  }

  const firstParagraph = body
    .split('\n\n')
    .map((part) => part.trim())
    .find((part) => part.length > 0);

  if (!firstParagraph) {
    return undefined;
  }

  const cleaned = firstParagraph
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.length > 0 ? cleaned : undefined;
}

function resolveSectionLanguageState(
  language: LanguageCode,
  present: boolean,
  translationStatus: JourneyTranslationStatusMap
): CanonicalJourneySectionLanguageState {
  if (!present) {
    return 'missing';
  }

  if (language === 'en') {
    return 'ready';
  }

  const stage = toEditorialStage(translationStatus[language]);
  if (stage === 'untranslated' || stage === 'draft_localized') {
    return 'draft';
  }

  return 'ready';
}

function buildCanonicalJourneyState(
  dayNumber: number,
  markdownByLanguage: Partial<Record<LanguageCode, string>>,
  translationStatus: JourneyTranslationStatusMap,
  meta: JourneyDayMetaFile | null,
  defaults: JourneySharedMetadata
): JourneySharedMetadata['canonical_journey'] {
  const englishMarkdown = markdownByLanguage.en || '';
  const urduMarkdown = markdownByLanguage.ur || '';
  const canonicalMeta = meta?.canonicalJourney;

  const quranBody = getSectionBody(englishMarkdown, ['quran reflection', 'quran for today', 'quran to sit with today']);
  const hadithBody = getSectionBody(englishMarkdown, ['hadith connection', 'a prophetic reminder', 'related hadith']);

  const detectedVerseKeys = parseVerseKeysFromSection(quranBody);
  const detectedHadith = parseHadithReference(hadithBody);

  const overrideRefs = canonicalMeta?.sacredSourceRefs;
  const quranRangeFromMeta = toCanonicalQuranRangeFromMeta(overrideRefs?.quranRange);
  const quranRange = quranRangeFromMeta || (detectedVerseKeys.length > 0
    ? null
    : DEFAULT_QURAN_RANGE);
  const verseKeysFromRange = buildVerseKeysFromQuranRange(quranRange);
  const verseKeys = verseKeysFromRange.length > 0
    ? verseKeysFromRange
    : (overrideRefs?.verseKeys && overrideRefs.verseKeys.length > 0)
      ? overrideRefs.verseKeys
      : detectedVerseKeys;

  const hadithCollection = overrideRefs?.hadithCollection || detectedHadith.collection || DEFAULT_HADITH_COLLECTION;
  const hadithNumber = overrideRefs?.hadithNumber || detectedHadith.number || DEFAULT_HADITH_NUMBER;
  const hadithSource =
    overrideRefs?.hadithSource ||
    detectedHadith.source ||
    canonicalHadithSourceLabel(hadithCollection, hadithNumber) ||
    undefined;
  const seerahReference = meta?.seerahReferences?.[0];

  const normalizedTafsir = normalizeCanonicalTafsirSettings({
    settings: canonicalMeta?.tafsir
      ? {
          enabled: canonicalMeta.tafsir.enabled,
          default_tafsir_id: canonicalMeta.tafsir.defaultTafsirId,
          scholar_ids: canonicalMeta.tafsir.scholarIds,
          fallback_behavior: canonicalMeta.tafsir.fallbackBehavior,
          reveal_mode: canonicalMeta.tafsir.revealMode,
        }
      : null,
    legacyDefaultTafsirId: canonicalMeta?.defaultTafsirId,
  });

  const sections = Object.fromEntries(
    CANONICAL_SECTION_CONFIG.map((section) => {
      const sectionMeta = canonicalMeta?.sections?.[section.id];
      const sectionContent = resolveSectionContentByLanguage(
        markdownByLanguage,
        section.aliases,
        section.urduAliases
      );

      const presentByLanguage: Partial<Record<LanguageCode, boolean>> = {
        en: hasSectionContent(englishMarkdown, section.aliases),
        ur: urduMarkdown
          ? hasSectionContent(urduMarkdown, [...section.aliases, ...section.urduAliases])
          : false,
      };

      const languageState: Partial<Record<LanguageCode, CanonicalJourneySectionLanguageState>> = {
        en: resolveSectionLanguageState('en', presentByLanguage.en === true, translationStatus),
        ur: resolveSectionLanguageState('ur', presentByLanguage.ur === true, translationStatus),
      };

      const sectionRefs = sectionMeta?.sacredRefs;
      const sectionRange = toCanonicalQuranRangeFromMeta(sectionRefs?.quranRange);

      return [
        section.id,
        {
          heading: sectionMeta?.heading || section.heading,
          emotional_goal: sectionMeta?.emotionalGoal || section.emotionalGoal,
          required: sectionMeta?.required ?? section.required,
          present: {
            ...presentByLanguage,
            ...(sectionMeta?.present || {}),
          },
          language_state: {
            ...languageState,
            ...(sectionMeta?.languageState || {}),
          },
          content: {
            ...sectionContent,
            ...((sectionMeta?.content as Partial<Record<LanguageCode, string>> | undefined) || {}),
          },
          sacred_refs: {
            ...(section.id === 'quran-reflection'
              ? {
                  ...(quranRange ? { quran_range: quranRange } : {}),
                  verse_keys: verseKeys,
                }
              : {}),
            ...(section.id === 'hadith-connection'
              ? {
                  hadith_collection: hadithCollection,
                  hadith_number: hadithNumber,
                  ...(hadithSource ? { hadith_source: hadithSource } : {}),
                }
              : {}),
            ...(section.id === 'seerah-moment' && seerahReference
              ? { seerah_reference: seerahReference }
              : {}),
            ...(sectionRefs?.verseKeys ? { verse_keys: sectionRefs.verseKeys } : {}),
            ...(sectionRange ? { quran_range: sectionRange } : {}),
            ...(sectionRefs?.hadithCollection ? { hadith_collection: sectionRefs.hadithCollection } : {}),
            ...(sectionRefs?.hadithNumber ? { hadith_number: sectionRefs.hadithNumber } : {}),
            ...(sectionRefs?.hadithSource ? { hadith_source: sectionRefs.hadithSource } : {}),
            ...(sectionRefs?.seerahReference ? { seerah_reference: sectionRefs.seerahReference } : {}),
          },
        },
      ];
    })
  );

  const hasUrduRuntime = isRuntimeReadyStatus(translationStatus.ur);
  const hasLocalizedUrdu = Boolean(markdownByLanguage.ur);
  const hasPublishedState =
    translationStatus.en === 'published' || translationStatus.ur === 'published';

  return {
    structure_version: canonicalMeta?.structureVersion || 1,
    week_identity: canonicalMeta?.weekIdentity || defaults.arc_identity || `week-${getWeekForDay(dayNumber)}`,
    emotional_note: canonicalMeta?.emotionalNote || defaults.emotional_note,
    publishing_state:
      canonicalMeta?.publishingState ||
      (hasPublishedState ? 'published' : hasUrduRuntime || hasLocalizedUrdu ? 'review' : 'draft'),
    default_tafsir_id: normalizedTafsir.default_tafsir_id,
    tafsir: {
      enabled: normalizedTafsir.enabled,
      default_tafsir_id: normalizedTafsir.default_tafsir_id,
      scholar_ids: normalizedTafsir.scholar_ids,
      fallback_behavior: normalizedTafsir.fallback_behavior,
      reveal_mode: normalizedTafsir.reveal_mode,
    },
    sacred_source_refs: {
      ...(quranRange ? { quran_range: quranRange } : {}),
      verse_keys: verseKeys,
      ...(hadithCollection ? { hadith_collection: hadithCollection } : {}),
      ...(hadithNumber ? { hadith_number: hadithNumber } : {}),
      ...(hadithSource ? { hadith_source: hadithSource } : {}),
    },
    sections,
  };
}

function defaultMetadataForDay(dayNumber: number): JourneySharedMetadata {
  const week = getWeekForDay(dayNumber);
  const weekArc = WEEKLY_EMOTIONAL_ARCS.find((item) => item.week === week);
  const dayIdentity = getDayIdentity(dayNumber);

  return {
    lesson_order: dayNumber,
    arc_identity: weekArc ? `week-${weekArc.week}` : `week-${week}`,
    week_chapter: weekArc?.chapterTitle,
    emotional_note: dayIdentity?.primaryEmotionalNote,
    seerah_references: dayIdentity?.seerahAtmosphere ? [dayIdentity.seerahAtmosphere] : [],
    estimated_minutes: 10,
    qa_status: {},
    content_version: 1,
  };
}

function computeBundleSourceHash(
  dayNumber: number,
  markdownByLanguage: Partial<Record<LanguageCode, string>>
): string {
  const ordered = SUPPORTED_LANGUAGES
    .map((language) => `${language}:${markdownByLanguage[language] || ''}`)
    .join('||');

  return createHash('sha256')
    .update(`day:${dayNumber}||${ordered}`)
    .digest('hex')
    .slice(0, 16);
}

function normalizeMetadata(
  dayNumber: number,
  meta: JourneyDayMetaFile | null,
  markdownByLanguage: Partial<Record<LanguageCode, string>>,
  translationStatus: JourneyTranslationStatusMap,
  sourceHash: string
): JourneySharedMetadata {
  const defaults = defaultMetadataForDay(dayNumber);
  const nowIso = new Date().toISOString();
  const contentVersion = meta?.contentVersion ?? defaults.content_version ?? 1;
  const sourceRevision = meta?.sourceRevision ?? `day-${String(dayNumber).padStart(2, '0')}-v${contentVersion}`;

  const currentLanguageStates = meta?.editorial?.language_states || {};
  const normalizedLanguageStates = Object.fromEntries(
    SUPPORTED_LANGUAGES.map((language) => {
      const existing = currentLanguageStates[language] || {};
      const status = translationStatus[language];
      const stage = toEditorialStage(status);

      return [
        language,
        {
          ...existing,
          stage,
          updated_at: existing.updated_at || nowIso,
          synced_source_hash: existing.synced_source_hash || sourceHash,
          content_hash: existing.content_hash || sourceHash,
        },
      ];
    })
  );

  const maxStage = JOURNEY_EDITORIAL_STAGE_ORDER.reduce((acc, stage) => {
    if (Object.values(normalizedLanguageStates).some((state) => state?.stage === stage)) {
      return stage;
    }
    return acc;
  }, 'untranslated' as const);

  return {
    lesson_order: meta?.lessonOrder ?? meta?.dayNumber ?? defaults.lesson_order,
    arc_identity: meta?.arcIdentity ?? defaults.arc_identity,
    week_chapter: meta?.weekChapter ?? defaults.week_chapter,
    emotional_note: meta?.emotionalNote ?? defaults.emotional_note,
    seerah_references: meta?.seerahReferences ?? defaults.seerah_references,
    estimated_minutes: meta?.estimatedMinutes ?? defaults.estimated_minutes,
    qa_status: meta?.qaStatus ?? defaults.qa_status,
    content_version: contentVersion,
    source_revision: sourceRevision,
    canonical_journey: buildCanonicalJourneyState(
      dayNumber,
      markdownByLanguage,
      translationStatus,
      meta,
      defaults
    ),
    editorial: {
      workflow_version: 1,
      canonical_source_language: 'en',
      source_hash: sourceHash,
      source_updated_at: meta?.editorial?.source_updated_at || nowIso,
      cross_language_checks: meta?.editorial?.cross_language_checks || {},
      publishing_safety_checks: meta?.editorial?.publishing_safety_checks || {},
      language_states: normalizedLanguageStates,
      drift_flags: meta?.editorial?.drift_flags || [],
      source_revision: sourceRevision,
      highest_stage: maxStage,
    },
  };
}

function normalizeTranslationStatus(
  markdownByLanguage: Partial<Record<LanguageCode, string>>,
  statusFromMeta: JourneyTranslationStatusMap | undefined
): JourneyTranslationStatusMap {
  const hasContentByLanguage = Object.fromEntries(
    SUPPORTED_LANGUAGES.map((language) => [language, Boolean(markdownByLanguage[language])])
  ) as Partial<Record<LanguageCode, boolean>>;

  return normalizeTranslationStages(statusFromMeta, {
    hasContentByLanguage,
    isPublished: false,
  });
}

async function readIfExists(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

async function loadStructuredBundles(minDay: number, maxDay: number): Promise<JourneyDayBundle[]> {
  const baseDir = path.join(process.cwd(), 'content', 'journey', 'days');
  const entries = await readdir(baseDir, { withFileTypes: true }).catch(() => []);
  const bundles: JourneyDayBundle[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const match = entry.name.match(/^day-(\d{1,2})$/i);
    if (!match) {
      continue;
    }

    const dayNumber = parseInt(match[1], 10);
    if (!Number.isFinite(dayNumber) || dayNumber < minDay || dayNumber > maxDay) {
      continue;
    }

    const dayDir = path.join(baseDir, entry.name);
    const en = await readIfExists(path.join(dayDir, 'en.md'));
    if (!en) {
      continue;
    }

    const ur = await readIfExists(path.join(dayDir, 'ur.md'));
    const metaRaw = await readIfExists(path.join(dayDir, 'meta.json'));

    let meta: JourneyDayMetaFile | null = null;
    if (metaRaw) {
      try {
        meta = JSON.parse(metaRaw) as JourneyDayMetaFile;
      } catch {
        meta = null;
      }
    }

    const markdownByLanguage: Partial<Record<LanguageCode, string>> = {
      en,
      ...(ur ? { ur } : {}),
    };

    const englishTitle = parseCanonicalDayTitle(en);
    const englishDescription = parseSectionIntro(en, ['opening reflection']);
    const englishReflectionPrompt = parseSectionIntro(en, ['private reflection', 'reflection for the heart']);

    const urduTitle = ur ? parseCanonicalDayTitle(ur) : undefined;
    const urduDescription = ur ? parseSectionIntro(ur, ['opening reflection', 'ابتدائی تامل', 'ابتدائی غور']) : undefined;
    const urduReflectionPrompt = ur ? parseSectionIntro(ur, ['private reflection', 'دل کا تامل', 'نجی تامل']) : undefined;

    const localized_content: Record<string, Record<string, string>> = {};
    if (urduTitle || urduDescription || urduReflectionPrompt) {
      localized_content.ur = {
        ...(urduTitle ? { title: urduTitle } : {}),
        ...(urduDescription ? { description: urduDescription } : {}),
        ...(urduReflectionPrompt ? { reflection_prompt: urduReflectionPrompt } : {}),
      };
    }

    const openingDescription = englishDescription || '';
    const reflectionPrompt = englishReflectionPrompt || '';

    const translationStatus = normalizeTranslationStatus(markdownByLanguage, meta?.translationStatus);
    const sourceHash = computeBundleSourceHash(dayNumber, markdownByLanguage);

    bundles.push({
      dayNumber,
      title: englishTitle || `Day ${dayNumber}`,
      description: openingDescription,
      reflectionPrompt,
      localized_content: Object.keys(localized_content).length > 0 ? localized_content : null,
      markdownByLanguage,
      metadata: normalizeMetadata(dayNumber, meta, markdownByLanguage, translationStatus, sourceHash),
      translationStatus,
      source: 'structured',
    });
  }

  return bundles.sort((a, b) => a.dayNumber - b.dayNumber);
}

async function loadLegacyBundles(
  minDay: number,
  maxDay: number,
  excludedDays: Set<number>
): Promise<JourneyDayBundle[]> {
  const legacyDir = path.join(process.cwd(), 'content', 'journey');
  const files = await readdir(legacyDir).catch(() => []);
  const bundles: JourneyDayBundle[] = [];

  for (const file of files) {
    const match = file.match(/^day(\d+)\.md$/i);
    if (!match) {
      continue;
    }

    const dayNumber = parseInt(match[1], 10);
    if (!Number.isFinite(dayNumber) || dayNumber < minDay || dayNumber > maxDay || excludedDays.has(dayNumber)) {
      continue;
    }

    const markdown = await readIfExists(path.join(legacyDir, file));
    if (!markdown) {
      continue;
    }

    const markdownByLanguage: Partial<Record<LanguageCode, string>> = { en: markdown };
    const englishTitle = parseCanonicalDayTitle(markdown);
    const openingDescription = parseSectionIntro(markdown, ['opening reflection']) || '';
    const reflectionPrompt = parseSectionIntro(markdown, ['private reflection', 'reflection for the heart']) || '';
    const translationStatus = normalizeTranslationStatus(markdownByLanguage, undefined);
    const sourceHash = computeBundleSourceHash(dayNumber, markdownByLanguage);

    bundles.push({
      dayNumber,
      title: englishTitle || `Day ${dayNumber}`,
      description: openingDescription,
      reflectionPrompt,
      localized_content: null,
      markdownByLanguage,
      metadata: normalizeMetadata(dayNumber, null, markdownByLanguage, translationStatus, sourceHash),
      translationStatus,
      source: 'legacy',
    });
  }

  return bundles.sort((a, b) => a.dayNumber - b.dayNumber);
}

export function getStructuredJourneyDayPath(dayNumber: number): string {
  return path.join('content', 'journey', 'days', toTitleCaseDay(dayNumber));
}

export async function loadJourneyDayBundles(minDay: number, maxDay: number): Promise<JourneyDayBundle[]> {
  const structured = await loadStructuredBundles(minDay, maxDay);
  const structuredDays = new Set(structured.map((item) => item.dayNumber));
  const legacy = await loadLegacyBundles(minDay, maxDay, structuredDays);
  return [...structured, ...legacy].sort((a, b) => a.dayNumber - b.dayNumber);
}
