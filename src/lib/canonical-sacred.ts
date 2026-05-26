import type {
  CanonicalQuranRange,
  CanonicalTafsirFallbackBehavior,
  CanonicalTafsirRevealMode,
  CanonicalTafsirSettings,
} from '@/types/journey-localization';

export const DEFAULT_QURAN_RANGE: Required<CanonicalQuranRange> = {
  surah_id: 96,
  ayah_start: 1,
  ayah_end: 5,
};

export type NormalizedQuranRange = Required<CanonicalQuranRange>;

export const DEFAULT_TAFSIR_ID = 169;
export const DEFAULT_TAFSIR_FALLBACK_BEHAVIOR: CanonicalTafsirFallbackBehavior = 'user-preferred';
export const DEFAULT_TAFSIR_REVEAL_MODE: CanonicalTafsirRevealMode = 'condensed';
export const DEFAULT_HADITH_COLLECTION = 'bukhari';
export const DEFAULT_HADITH_NUMBER = 7405;

const MAX_QURAN_RANGE_SPAN = 20;

function toPositiveInt(value: unknown): number | null {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function sanitizeQuranRange(
  range: Partial<CanonicalQuranRange> | null | undefined
): NormalizedQuranRange | null {
  const surahId = toPositiveInt(range?.surah_id);
  const ayahStart = toPositiveInt(range?.ayah_start);
  const ayahEndRaw = toPositiveInt(range?.ayah_end);

  if (!surahId || !ayahStart || surahId < 1 || surahId > 114) {
    return null;
  }

  const normalizedEnd = ayahEndRaw && ayahEndRaw >= ayahStart ? ayahEndRaw : ayahStart;
  const boundedEnd = Math.min(normalizedEnd, ayahStart + MAX_QURAN_RANGE_SPAN - 1);

  return {
    surah_id: surahId,
    ayah_start: ayahStart,
    ayah_end: boundedEnd,
  };
}

export function buildVerseKeysFromQuranRange(range: Partial<CanonicalQuranRange> | null | undefined): string[] {
  const normalized = sanitizeQuranRange(range);
  if (!normalized) {
    return [];
  }

  const keys: string[] = [];
  for (let ayah = normalized.ayah_start; ayah <= normalized.ayah_end; ayah += 1) {
    keys.push(`${normalized.surah_id}:${ayah}`);
  }

  return keys;
}

export function sanitizeVerseKeys(verseKeys: string[] | null | undefined): string[] {
  if (!Array.isArray(verseKeys)) {
    return [];
  }

  return Array.from(
    new Set(
      verseKeys
        .map((key) => String(key || '').trim())
        .filter((key) => /^\d{1,3}:\d{1,3}$/.test(key))
    )
  );
}

export function inferQuranRangeFromVerseKeys(
  verseKeys: string[] | null | undefined
): NormalizedQuranRange | null {
  const keys = sanitizeVerseKeys(verseKeys);
  if (keys.length === 0) {
    return null;
  }

  const parsed = keys
    .map((key) => {
      const [surahText, ayahText] = key.split(':');
      return {
        surah: Number.parseInt(surahText, 10),
        ayah: Number.parseInt(ayahText, 10),
      };
    })
    .filter((item) => Number.isFinite(item.surah) && Number.isFinite(item.ayah));

  if (parsed.length === 0) {
    return null;
  }

  const firstSurah = parsed[0].surah;
  if (parsed.some((item) => item.surah !== firstSurah)) {
    return null;
  }

  const sortedAyahs = Array.from(new Set(parsed.map((item) => item.ayah))).sort((a, b) => a - b);
  for (let index = 1; index < sortedAyahs.length; index += 1) {
    if (sortedAyahs[index] !== sortedAyahs[index - 1] + 1) {
      return null;
    }
  }

  return sanitizeQuranRange({
    surah_id: firstSurah,
    ayah_start: sortedAyahs[0],
    ayah_end: sortedAyahs[sortedAyahs.length - 1],
  });
}

function normalizeCollectionKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, '');
}

export function canonicalHadithSourceLabel(collection: string | null | undefined, number: number | null | undefined): string | null {
  if (!collection || !number) {
    return null;
  }

  const namesByCollection: Record<string, string> = {
    bukhari: 'Sahih al-Bukhari',
    muslim: 'Sahih Muslim',
    abudawud: 'Sunan Abu Dawud',
    tirmidhi: "Jami' at-Tirmidhi",
    nasai: "Sunan an-Nasa'i",
    ibnmajah: 'Sunan Ibn Majah',
    malik: 'Muwatta Malik',
  };

  const normalized = normalizeCollectionKey(collection);
  const label = namesByCollection[normalized] || collection;
  return `${label} ${number}`;
}

export function normalizeTafsirScholarIds(
  scholarIds: number[] | null | undefined,
  defaultTafsirId: number = DEFAULT_TAFSIR_ID
): number[] {
  const normalized = Array.from(
    new Set(
      (scholarIds || [])
        .map((value) => toPositiveInt(value))
        .filter((value): value is number => value !== null)
    )
  );

  if (normalized.length === 0) {
    return [defaultTafsirId];
  }

  if (!normalized.includes(defaultTafsirId)) {
    return [defaultTafsirId, ...normalized];
  }

  return normalized;
}

export interface NormalizedCanonicalTafsirSettings {
  enabled: boolean;
  default_tafsir_id: number;
  scholar_ids: number[];
  fallback_behavior: CanonicalTafsirFallbackBehavior;
  reveal_mode: CanonicalTafsirRevealMode;
}

function normalizeTafsirFallbackBehavior(value: unknown): CanonicalTafsirFallbackBehavior {
  if (value === 'default-only' || value === 'hide-if-unavailable') {
    return value;
  }

  return DEFAULT_TAFSIR_FALLBACK_BEHAVIOR;
}

function normalizeTafsirRevealMode(value: unknown): CanonicalTafsirRevealMode {
  if (value === 'full') {
    return 'full';
  }

  return DEFAULT_TAFSIR_REVEAL_MODE;
}

export function normalizeCanonicalTafsirSettings(options: {
  settings?: CanonicalTafsirSettings | null;
  legacyDefaultTafsirId?: number | null;
}): NormalizedCanonicalTafsirSettings {
  const defaultTafsirId =
    toPositiveInt(options.settings?.default_tafsir_id) ||
    toPositiveInt(options.legacyDefaultTafsirId) ||
    DEFAULT_TAFSIR_ID;

  const enabled = options.settings?.enabled !== false;
  const fallbackBehavior = normalizeTafsirFallbackBehavior(options.settings?.fallback_behavior);
  const revealMode = normalizeTafsirRevealMode(options.settings?.reveal_mode);
  const scholarIds = normalizeTafsirScholarIds(options.settings?.scholar_ids, defaultTafsirId);

  return {
    enabled,
    default_tafsir_id: defaultTafsirId,
    scholar_ids: scholarIds,
    fallback_behavior: fallbackBehavior,
    reveal_mode: revealMode,
  };
}

export function resolveCanonicalTafsirForRuntime(options: {
  settings?: CanonicalTafsirSettings | null;
  legacyDefaultTafsirId?: number | null;
  userPreferredTafsirId?: number | null;
}): {
  enabled: boolean;
  tafsir_id: number | null;
  reveal_mode: CanonicalTafsirRevealMode;
  fallback_behavior: CanonicalTafsirFallbackBehavior;
  scholar_ids: number[];
  fallback_used: boolean;
} {
  const normalized = normalizeCanonicalTafsirSettings({
    settings: options.settings,
    legacyDefaultTafsirId: options.legacyDefaultTafsirId,
  });

  if (!normalized.enabled) {
    return {
      enabled: false,
      tafsir_id: null,
      reveal_mode: normalized.reveal_mode,
      fallback_behavior: normalized.fallback_behavior,
      scholar_ids: normalized.scholar_ids,
      fallback_used: false,
    };
  }

  const preferred = toPositiveInt(options.userPreferredTafsirId);
  const hasPreferred = preferred !== null && normalized.scholar_ids.includes(preferred);
  let resolvedTafsirId: number | null = null;
  let fallbackUsed = false;

  if (normalized.fallback_behavior === 'default-only') {
    resolvedTafsirId = normalized.default_tafsir_id;
    fallbackUsed = preferred !== null && preferred !== resolvedTafsirId;
  } else if (normalized.fallback_behavior === 'hide-if-unavailable') {
    resolvedTafsirId = hasPreferred ? preferred : null;
    fallbackUsed = !hasPreferred;
  } else if (hasPreferred) {
    resolvedTafsirId = preferred;
  } else {
    resolvedTafsirId = normalized.default_tafsir_id;
    fallbackUsed = preferred !== null && preferred !== resolvedTafsirId;
  }

  if (resolvedTafsirId !== null && !normalized.scholar_ids.includes(resolvedTafsirId)) {
    resolvedTafsirId = normalized.default_tafsir_id;
    fallbackUsed = true;
  }

  return {
    enabled: true,
    tafsir_id: resolvedTafsirId,
    reveal_mode: normalized.reveal_mode,
    fallback_behavior: normalized.fallback_behavior,
    scholar_ids: normalized.scholar_ids,
    fallback_used: fallbackUsed,
  };
}

export function toCanonicalVerseReferenceLabel(range: CanonicalQuranRange | null | undefined): string {
  const normalized = sanitizeQuranRange(range);
  if (!normalized) {
    return `${DEFAULT_QURAN_RANGE.surah_id}:${DEFAULT_QURAN_RANGE.ayah_start}-${DEFAULT_QURAN_RANGE.ayah_end}`;
  }

  return `${normalized.surah_id}:${normalized.ayah_start}-${normalized.ayah_end}`;
}
