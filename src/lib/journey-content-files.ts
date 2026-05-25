import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/i18n/config';
import { getDayIdentity, getWeekForDay, WEEKLY_EMOTIONAL_ARCS } from './journey-emotional-arc';
import type { JourneySharedMetadata, JourneyTranslationStatusMap } from '@/types/journey-localization';
import {
  JOURNEY_EDITORIAL_STAGE_ORDER,
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
}

export interface JourneyDayBundle {
  dayNumber: number;
  markdownByLanguage: Partial<Record<LanguageCode, string>>;
  metadata: JourneySharedMetadata;
  translationStatus: JourneyTranslationStatusMap;
  source: 'structured' | 'legacy';
}

function toTitleCaseDay(value: number): string {
  return `day-${String(value).padStart(2, '0')}`;
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

    const translationStatus = normalizeTranslationStatus(markdownByLanguage, meta?.translationStatus);
    const sourceHash = computeBundleSourceHash(dayNumber, markdownByLanguage);

    bundles.push({
      dayNumber,
      markdownByLanguage,
      metadata: normalizeMetadata(dayNumber, meta, translationStatus, sourceHash),
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
    const translationStatus = normalizeTranslationStatus(markdownByLanguage, undefined);
    const sourceHash = computeBundleSourceHash(dayNumber, markdownByLanguage);

    bundles.push({
      dayNumber,
      markdownByLanguage,
      metadata: normalizeMetadata(dayNumber, null, translationStatus, sourceHash),
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
