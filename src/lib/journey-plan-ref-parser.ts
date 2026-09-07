import { SURAH_NAMES } from './quran-surah-names';

export interface SurahReference {
  surahNumber: number;
  surahName: string;
  ayahRange: string;
}

export interface ParsedDayRef {
  surahs: SurahReference[];
  sourceTypes: Array<'Quran' | 'Seerah' | 'Hadith' | 'History' | 'Reflection'>;
  hadithSource?: string;
}

// Days whose lesson includes a dedicated "Hadith connection" section, verified
// against the actual authored content in content/journey/seerah/day-0NN/en.md
// (grep for "## Hadith connection"). Only days 1-30 are authored so far;
// this list is extended as later eras are written, never guessed ahead of it.
const CONFIRMED_HADITH_DAYS: Record<number, string> = {
  1: 'Bukhari',
  2: 'Bukhari',
  4: 'Muslim',
  18: 'Bukhari & Muslim',
};

function parseSurahTokens(text: string): SurahReference[] {
  const matches = text.matchAll(/(\d{1,3}):(\d{1,3})(?:[–-](\d{1,3}))?/g);
  const surahs: SurahReference[] = [];
  for (const m of matches) {
    const surahNumber = parseInt(m[1], 10);
    const name = SURAH_NAMES[surahNumber];
    if (!name) continue;
    const ayahRange = m[3] ? `${m[2]}–${m[3]}` : m[2];
    surahs.push({ surahNumber, surahName: name, ayahRange: `${surahNumber}:${ayahRange}` });
  }
  return surahs;
}

// Strips combining diacritics after NFD decomposition so keyword matching
// works regardless of whether the source text uses precomposed characters
// or decomposed base+combining-mark sequences for letters like the one in
// "hadith" transliterations.
function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function parseDayRef(ref: string, day: number): ParsedDayRef {
  const surahs = parseSurahTokens(ref);
  const plain = stripDiacritics(ref);
  const sourceTypes: ParsedDayRef['sourceTypes'] = [];
  let hadithSource: string | undefined;

  if (surahs.length > 0) {
    sourceTypes.push('Quran');
  }
  if (/seerah/i.test(plain)) {
    sourceTypes.push('Seerah');
  }
  if (/hadith/i.test(plain)) {
    sourceTypes.push('Hadith');
    const sourceMatch = ref.match(/\(([^)]+)\)/);
    if (sourceMatch) {
      hadithSource = sourceMatch[1];
    }
  }
  if (/^history$/i.test(plain.trim())) {
    sourceTypes.push('History');
  }
  if (/^reflection$/i.test(plain.trim())) {
    sourceTypes.push('Reflection');
  }

  if (CONFIRMED_HADITH_DAYS[day]) {
    if (!sourceTypes.includes('Hadith')) sourceTypes.push('Hadith');
    if (!hadithSource) hadithSource = CONFIRMED_HADITH_DAYS[day];
  }

  if (sourceTypes.length === 0) {
    // Every ref in the curriculum should match one of the above; fall back
    // to labeling it Seerah (a narrative/historical scene) rather than
    // silently showing nothing.
    sourceTypes.push('Seerah');
  }

  return { surahs, sourceTypes, hadithSource };
}
