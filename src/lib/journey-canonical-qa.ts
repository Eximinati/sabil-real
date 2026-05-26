import type { LanguageCode } from '@/lib/i18n/config';
import type {
  CanonicalJourneySectionId,
  CanonicalJourneyState,
  JourneyTranslationStatusMap,
} from '@/types/journey-localization';
import { toEditorialStage } from './journey-editorial';
import { sanitizeQuranRange } from './canonical-sacred';

export interface CanonicalQaIssue {
  id: string;
  severity: 'critical' | 'warning' | 'note';
  title: string;
  detail: string;
}

export interface CanonicalQaReport {
  score: number;
  isCanonicalComplete: boolean;
  issues: CanonicalQaIssue[];
  missingSections: CanonicalJourneySectionId[];
}

const CANONICAL_SECTION_ORDER: CanonicalJourneySectionId[] = [
  'opening-reflection',
  'seerah-moment',
  'quran-reflection',
  'tafsir-insight',
  'hadith-connection',
  'reflection-prompt',
  'tiny-action',
  'closing-dua',
];

const REQUIRED_SECTION_ORDER: CanonicalJourneySectionId[] = [
  'opening-reflection',
  'seerah-moment',
  'quran-reflection',
  'hadith-connection',
  'reflection-prompt',
  'tiny-action',
  'closing-dua',
];

const HARSH_PATTERNS = [
  /you must/gi,
  /real believers/gi,
  /shame on/gi,
  /lazy/gi,
  /hypocrite/gi,
  /تمہیں لازماً/gi,
  /شرم/gi,
  /منافق/gi,
];

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/\s+/g, ' ').trim();
}

function getSectionText(
  canonical: CanonicalJourneyState | undefined,
  sectionId: CanonicalJourneySectionId,
  language: LanguageCode
): string {
  const section = canonical?.sections?.[sectionId];
  const byLanguage = section?.content?.[language];
  const fallback = section?.content?.en;

  return normalizeText(byLanguage || fallback || '');
}

function isUrduScriptDominant(value: string): boolean {
  if (!value) {
    return false;
  }

  const letters = value.match(/[\p{L}]/gu) || [];
  if (letters.length === 0) {
    return false;
  }

  const urduLetters = value.match(/[\u0600-\u06FF]/g) || [];
  return urduLetters.length / letters.length >= 0.35;
}

function getVerseKeys(canonical: CanonicalJourneyState | undefined): string[] {
  const sectionRange = canonical?.sections?.['quran-reflection']?.sacred_refs?.quran_range;
  const rootRange = canonical?.sacred_source_refs?.quran_range;
  const range = sanitizeQuranRange(sectionRange || rootRange);

  if (range) {
    const keys: string[] = [];
    for (let ayah = range.ayah_start || 0; ayah <= (range.ayah_end || 0); ayah += 1) {
      keys.push(`${range.surah_id}:${ayah}`);
    }
    return keys;
  }

  const fromSection = canonical?.sections?.['quran-reflection']?.sacred_refs?.verse_keys;
  if (fromSection && fromSection.length > 0) {
    return fromSection;
  }

  return canonical?.sacred_source_refs?.verse_keys || [];
}

function getHadithRef(canonical: CanonicalJourneyState | undefined) {
  const fromSection = canonical?.sections?.['hadith-connection']?.sacred_refs;
  const fromRoot = canonical?.sacred_source_refs;

  return {
    collection: fromSection?.hadith_collection || fromRoot?.hadith_collection || '',
    number: fromSection?.hadith_number || fromRoot?.hadith_number || 0,
  };
}

function validateQuranRange(canonical: CanonicalJourneyState | undefined): CanonicalQaIssue | null {
  const sectionRange = canonical?.sections?.['quran-reflection']?.sacred_refs?.quran_range;
  const rootRange = canonical?.sacred_source_refs?.quran_range;
  const rawRange = sectionRange || rootRange;
  if (!rawRange) {
    return {
      id: 'missing-quran-range',
      severity: 'warning',
      title: 'Quran range not set',
      detail: 'Set Surah + Ayah start/end so sacred-source Quran rendering stays scalable.',
    };
  }

  const normalized = sanitizeQuranRange(rawRange);
  if (!normalized) {
    return {
      id: 'invalid-quran-range',
      severity: 'critical',
      title: 'Quran range is invalid',
      detail: 'Quran range must include valid surah and ayah start/end values.',
    };
  }

  return null;
}

function validateTafsirConfig(canonical: CanonicalJourneyState | undefined): CanonicalQaIssue | null {
  const tafsir = canonical?.tafsir;
  if (tafsir?.enabled === false) {
    return null;
  }

  const defaultTafsirId = tafsir?.default_tafsir_id || canonical?.default_tafsir_id;
  if (!defaultTafsirId || defaultTafsirId <= 0) {
    return {
      id: 'missing-tafsir-default',
      severity: 'warning',
      title: 'Tafsir default scholar missing',
      detail: 'Set a default tafsir scholar id for stable contemplative fallback.',
    };
  }

  return null;
}

export function analyzeCanonicalJourneyDraft(params: {
  canonical?: CanonicalJourneyState;
  translationStatus?: JourneyTranslationStatusMap;
  enforceUrduReadiness?: boolean;
}): CanonicalQaReport {
  const canonical = params.canonical;
  const issues: CanonicalQaIssue[] = [];

  const missingSections: CanonicalJourneySectionId[] = [];
  for (const sectionId of REQUIRED_SECTION_ORDER) {
    const text = getSectionText(canonical, sectionId, 'en');
    if (!text) {
      missingSections.push(sectionId);
    }
  }

  if (missingSections.length > 0) {
    issues.push({
      id: 'missing-sections',
      severity: 'critical',
      title: 'Canonical rhythm incomplete',
      detail: `Missing English content in ${missingSections.length} required section(s).`,
    });
  }

  const opening = getSectionText(canonical, 'opening-reflection', 'en');
  const closing = getSectionText(canonical, 'closing-dua', 'en');
  const hasWarmthSignal = /allah|mercy|رحمت|اللہ/i.test(`${opening} ${closing}`);
  if (!hasWarmthSignal) {
    issues.push({
      id: 'warmth-signal',
      severity: 'warning',
      title: 'Warmth signal is weak',
      detail: 'Opening/closing copy may be missing clear mercy-oriented spiritual language.',
    });
  }

  const verseKeys = getVerseKeys(canonical);
  const quranRangeIssue = validateQuranRange(canonical);
  if (quranRangeIssue) {
    issues.push(quranRangeIssue);
  }
  const invalidVerseKeys = verseKeys.filter((key) => !/^\d{1,3}:\d{1,3}$/.test(key));
  if (verseKeys.length === 0) {
    issues.push({
      id: 'missing-verse-keys',
      severity: 'critical',
      title: 'Quran references missing',
      detail: 'Add at least one Quran verse key for canonical Quran reflection.',
    });
  } else if (invalidVerseKeys.length > 0) {
    issues.push({
      id: 'invalid-verse-keys',
      severity: 'warning',
      title: 'Some verse keys are invalid',
      detail: `Invalid format: ${invalidVerseKeys.slice(0, 3).join(', ')}${invalidVerseKeys.length > 3 ? '...' : ''}`,
    });
  }

  const hadith = getHadithRef(canonical);
  if (!hadith.collection || !hadith.number) {
    issues.push({
      id: 'missing-hadith-ref',
      severity: 'warning',
      title: 'Hadith API reference missing',
      detail: 'Set hadith collection and number so hadith renders from source API.',
    });
  }

  const tafsirIssue = validateTafsirConfig(canonical);
  if (tafsirIssue) {
    issues.push(tafsirIssue);
  }

  const longSections = CANONICAL_SECTION_ORDER.filter((sectionId) => {
    const text = getSectionText(canonical, sectionId, 'en');
    return text.length > 900;
  });
  if (longSections.length > 0) {
    issues.push({
      id: 'long-sections',
      severity: 'note',
      title: 'Potential pacing heaviness',
      detail: `${longSections.length} section(s) are long for mobile contemplative reading.`,
    });
  }

  const repeatedStarts = new Set<string>();
  let repetitionHits = 0;
  for (const sectionId of CANONICAL_SECTION_ORDER) {
    const text = getSectionText(canonical, sectionId, 'en');
    if (!text) {
      continue;
    }

    const firstWords = text
      .toLowerCase()
      .split(/\s+/)
      .slice(0, 4)
      .join(' ');

    if (firstWords.length === 0) {
      continue;
    }

    if (repeatedStarts.has(firstWords)) {
      repetitionHits += 1;
    } else {
      repeatedStarts.add(firstWords);
    }
  }
  if (repetitionHits > 0) {
    issues.push({
      id: 'repetition-risk',
      severity: 'note',
      title: 'Repetition risk detected',
      detail: 'Multiple sections begin with similar phrasing. Consider varying openings.',
    });
  }

  const combinedEnglish = CANONICAL_SECTION_ORDER.map((sectionId) => getSectionText(canonical, sectionId, 'en')).join(' ');
  const harshHit = HARSH_PATTERNS.find((pattern) => pattern.test(combinedEnglish));
  if (harshHit) {
    issues.push({
      id: 'harsh-language',
      severity: 'warning',
      title: 'Beginner safety warning',
      detail: 'Potentially harsh wording found. Soften tone before publish.',
    });
  }

  const urStage = toEditorialStage(params.translationStatus?.ur);
  const shouldCheckUrdu = params.enforceUrduReadiness === true || urStage !== 'untranslated';

  if (shouldCheckUrdu) {
    const missingUrSections = REQUIRED_SECTION_ORDER.filter((sectionId) => {
      const urduText = normalizeText(canonical?.sections?.[sectionId]?.content?.ur || '');
      return urduText.length === 0;
    });

    if (missingUrSections.length > 0) {
      issues.push({
        id: 'missing-urdu-sections',
        severity: urStage === 'qa_approved' || urStage === 'published' ? 'warning' : 'note',
        title: 'Urdu localization has gaps',
        detail: `${missingUrSections.length} canonical section(s) have no Urdu authored content.`,
      });
    }

    const mixedScriptSections = REQUIRED_SECTION_ORDER.filter((sectionId) => {
      const urduText = normalizeText(canonical?.sections?.[sectionId]?.content?.ur || '');
      return urduText.length > 0 && !isUrduScriptDominant(urduText);
    });

    if (mixedScriptSections.length > 0) {
      issues.push({
        id: 'mixed-script-urdu',
        severity: 'note',
        title: 'Urdu script quality watch',
        detail: 'Some Urdu sections appear mixed-script. Review for localization softness.',
      });
    }
  }

  let score = 100;
  for (const issue of issues) {
    if (issue.severity === 'critical') {
      score -= 18;
    } else if (issue.severity === 'warning') {
      score -= 9;
    } else {
      score -= 4;
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    isCanonicalComplete: missingSections.length === 0,
    issues,
    missingSections,
  };
}
