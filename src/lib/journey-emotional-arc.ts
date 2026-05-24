export type EmotionalTone =
  | 'reassurance'
  | 'mercy'
  | 'awe'
  | 'repentance'
  | 'surrender'
  | 'gratitude'
  | 'longing'
  | 'stillness'
  | 'discipline'
  | 'hope'
  | 'fear'
  | 'reflection'
  | 'healing'
  | 'trust';

export type DayCadence = 'restorative' | 'light' | 'balanced' | 'deep' | 'action';

export interface WeeklyEmotionalArc {
  week: number;
  dayRange: [number, number];
  chapterTitle: string;
  emotionalGoals: string[];
  spiritualThemes: string[];
  emotionalTone: string;
  pacingStyle: string;
  dominantSeerahAtmosphere: string;
  dominantQuranAtmosphere: string;
}

export interface DayIdentity {
  day: number;
  title: string;
  primaryEmotionalNote: EmotionalTone;
  dominantSpiritualMovement: string;
  cadence: DayCadence;
  seerahAtmosphere: string;
  quranAtmosphere: string;
  actionStyle: string;
}

export interface SeerahProgressionNode {
  week: number;
  emotionalThread: string;
  suggestedMoments: string[];
}

export interface ArcRiskReport {
  repeatedToneRuns: Array<{ tone: EmotionalTone; runLength: number; days: number[] }>;
  repeatedActionStyleRuns: Array<{ actionStyle: string; runLength: number; days: number[] }>;
  cadenceImbalanceWarnings: string[];
  weekOverlapWarnings: string[];
}

export const WEEKLY_COHERENCE_QA_CHECKLIST = [
  'Does this week avoid repeating the same emotional note too many days in a row?',
  'Do Seerah moments vary emotionally instead of repeating one hardship beat?',
  'Do tiny actions vary (dua, worship anchor, relationship, service, reflection)?',
  'Is there at least one lighter/restorative day in the week?',
  'Do transitions feel like one unfolding chapter, not isolated lessons?',
];

export const WEEKLY_EMOTIONAL_ARCS: WeeklyEmotionalArc[] = [
  {
    week: 1,
    dayRange: [1, 7],
    chapterTitle: 'Seen and Welcomed by Allah',
    emotionalGoals: ['Safety', 'Hope', 'Belonging', 'Gentle return'],
    spiritualThemes: ['Nearness', 'Mercy', 'Purpose', 'Trust beginnings'],
    emotionalTone: 'Tender reassurance with quiet grounding',
    pacingStyle: 'Soft, spacious, low cognitive load',
    dominantSeerahAtmosphere: 'Early vulnerability and reliance',
    dominantQuranAtmosphere: 'Reassuring verses and identity-forming ayat',
  },
  {
    week: 2,
    dayRange: [8, 14],
    chapterTitle: 'Trust and Surrender',
    emotionalGoals: ['Release control', 'Steady tawakkul', 'Patience with delay'],
    spiritualThemes: ['Reliance', 'Qadr', 'Dua with certainty', 'Gratitude under uncertainty'],
    emotionalTone: 'Settled courage and reliance',
    pacingStyle: 'Balanced reflection with trust-building action steps',
    dominantSeerahAtmosphere: 'Steadiness under pressure',
    dominantQuranAtmosphere: 'Verses of trust, decree, and divine sufficiency',
  },
  {
    week: 3,
    dayRange: [15, 21],
    chapterTitle: 'Inner Honesty and Return',
    emotionalGoals: ['Sincere self-accounting', 'Repentance without shame', 'Heart purification'],
    spiritualThemes: ['Ikhlas', 'Tazkiyah', 'Truthfulness', 'Restraint and healing'],
    emotionalTone: 'Honest, humble, and healing',
    pacingStyle: 'Deeper introspection with more pauses',
    dominantSeerahAtmosphere: 'Moral courage and inward refinement',
    dominantQuranAtmosphere: 'Verses on nafs, repentance, and sincerity',
  },
  {
    week: 4,
    dayRange: [22, 28],
    chapterTitle: 'Living Islam Gently and Consistently',
    emotionalGoals: ['Sustainable worship', 'Merciful character', 'Steady daily devotion'],
    spiritualThemes: ['Prayer anchoring', 'Mercy in relationships', 'Consistency over intensity'],
    emotionalTone: 'Warm discipline and practical gentleness',
    pacingStyle: 'Alternating lighter and action-focused days',
    dominantSeerahAtmosphere: 'Embodied mercy in daily life',
    dominantQuranAtmosphere: 'Practical ethical and devotional guidance',
  },
  {
    week: 5,
    dayRange: [29, 30],
    chapterTitle: 'Renewal and Continuity',
    emotionalGoals: ['Perseverance', 'Non-guilt return', 'Long-horizon companionship'],
    spiritualThemes: ['Renewal', 'Steadfastness', 'Ongoing journey'],
    emotionalTone: 'Hopeful integration',
    pacingStyle: 'Restorative and forward-looking',
    dominantSeerahAtmosphere: 'Perseverance after pauses',
    dominantQuranAtmosphere: 'Constancy, mercy, and future-oriented trust',
  },
];

export const EMOTIONAL_VARIETY_TONES: EmotionalTone[] = [
  'reassurance',
  'mercy',
  'awe',
  'repentance',
  'surrender',
  'gratitude',
  'longing',
  'stillness',
  'discipline',
  'hope',
  'fear',
  'reflection',
  'healing',
  'trust',
];

export const SEERAH_PROGRESSION_MAP: SeerahProgressionNode[] = [
  {
    week: 1,
    emotionalThread: 'Beginning with vulnerability and welcome',
    suggestedMoments: [
      'Cave Hira and first revelation',
      'Early reassurance during uncertainty',
      'Steadiness in fear (Cave Thawr)',
    ],
  },
  {
    week: 2,
    emotionalThread: 'Trust under pressure',
    suggestedMoments: [
      'Hijrah reliance decisions',
      'Badr dua and dependence',
      'Endurance through social pressure and scarcity',
    ],
  },
  {
    week: 3,
    emotionalThread: 'Inner purification and sincerity',
    suggestedMoments: [
      'Night worship and private devotion',
      'Mercy after personal hurt (Taif lens)',
      'Truthfulness under accusation and trial',
    ],
  },
  {
    week: 4,
    emotionalThread: 'Embodied mercy in ordinary life',
    suggestedMoments: [
      'Prophetic gentleness in family life',
      'Mercy toward those who opposed him',
      'Consistency in worship and character',
    ],
  },
  {
    week: 5,
    emotionalThread: 'Renewing commitment after pauses',
    suggestedMoments: [
      'Resilience after revelation gaps',
      'Returning to mission with hope and trust',
    ],
  },
];

export const FATIGUE_PREVENTION_RULES = [
  'Use at least one restorative day every 4-5 days.',
  'Avoid more than two consecutive deep-intensity days.',
  'Alternate action-focused days with contemplative or light days.',
  'Prevent repeated emotional peaks without recovery space.',
  'Vary action style: dua, relationship repair, worship anchor, service, gratitude.',
];

export const DAY_IDENTITY_30: DayIdentity[] = [
  { day: 1, title: 'Allah Sees You', primaryEmotionalNote: 'reassurance', dominantSpiritualMovement: 'Welcome', cadence: 'restorative', seerahAtmosphere: 'first revelation', quranAtmosphere: 'beginning light', actionStyle: 'quiet dua' },
  { day: 2, title: 'You Were Created With Purpose', primaryEmotionalNote: 'hope', dominantSpiritualMovement: 'Orientation', cadence: 'balanced', seerahAtmosphere: 'public call to truth', quranAtmosphere: 'purpose and test', actionStyle: 'intent reset' },
  { day: 3, title: 'Allah Is Closer Than You Think', primaryEmotionalNote: 'trust', dominantSpiritualMovement: 'Nearness', cadence: 'restorative', seerahAtmosphere: 'cave companionship', quranAtmosphere: 'divine nearness', actionStyle: 'personal dua' },
  { day: 4, title: 'Mercy Is Greater Than Your Shame', primaryEmotionalNote: 'mercy', dominantSpiritualMovement: 'Return', cadence: 'deep', seerahAtmosphere: 'taif resilience', quranAtmosphere: 'mercy and no despair', actionStyle: 'specific repentance' },
  { day: 5, title: 'Patience Is Staying With Allah', primaryEmotionalNote: 'discipline', dominantSpiritualMovement: 'Steadiness', cadence: 'balanced', seerahAtmosphere: 'endurance in hardship', quranAtmosphere: 'sabr and ease', actionStyle: 'dhikr in frustration' },
  { day: 6, title: 'Your Dua Is Heard', primaryEmotionalNote: 'longing', dominantSpiritualMovement: 'Supplication', cadence: 'light', seerahAtmosphere: 'badr dependence', quranAtmosphere: 'answering call', actionStyle: 'repeat one dua' },
  { day: 7, title: 'Keep Walking Gently', primaryEmotionalNote: 'stillness', dominantSpiritualMovement: 'Continuation', cadence: 'restorative', seerahAtmosphere: 'reassurance after pause', quranAtmosphere: 'duha reassurance', actionStyle: 'choose one tiny practice' },
  { day: 8, title: 'Trust Allah With What You Cannot Control', primaryEmotionalNote: 'surrender', dominantSpiritualMovement: 'Release control', cadence: 'balanced', seerahAtmosphere: 'hijrah planning with trust', quranAtmosphere: 'reliance', actionStyle: 'release statement dua' },
  { day: 9, title: 'When Plans Change, Allah Remains', primaryEmotionalNote: 'trust', dominantSpiritualMovement: 'Acceptance', cadence: 'light', seerahAtmosphere: 'unexpected turns in mission', quranAtmosphere: 'decree wisdom', actionStyle: 'acceptance journal line' },
  { day: 10, title: 'Sufficiency in Allah', primaryEmotionalNote: 'awe', dominantSpiritualMovement: 'Dependence', cadence: 'deep', seerahAtmosphere: 'small means, great trust', quranAtmosphere: 'Allah is enough', actionStyle: 'hasbunallah practice' },
  { day: 11, title: 'Contentment Without Passivity', primaryEmotionalNote: 'reflection', dominantSpiritualMovement: 'Rida', cadence: 'balanced', seerahAtmosphere: 'patient striving', quranAtmosphere: 'effort and trust', actionStyle: 'contentment intention' },
  { day: 12, title: 'Gratitude in the Ordinary', primaryEmotionalNote: 'gratitude', dominantSpiritualMovement: 'Noticing', cadence: 'light', seerahAtmosphere: 'prophetic gratitude', quranAtmosphere: 'increase through shukr', actionStyle: 'three blessings note' },
  { day: 13, title: 'Between Hope and Fear', primaryEmotionalNote: 'fear', dominantSpiritualMovement: 'Balance', cadence: 'deep', seerahAtmosphere: 'earnest dua', quranAtmosphere: 'rahmah and accountability', actionStyle: 'dua with hope+fear' },
  { day: 14, title: 'Trust After Delay', primaryEmotionalNote: 'hope', dominantSpiritualMovement: 'Persevering trust', cadence: 'restorative', seerahAtmosphere: 'waiting with certainty', quranAtmosphere: 'promise in delay', actionStyle: 'wait-with-trust prayer' },
  { day: 15, title: 'Begin With Honest Self-Seeing', primaryEmotionalNote: 'reflection', dominantSpiritualMovement: 'Muhasabah', cadence: 'deep', seerahAtmosphere: 'night introspection', quranAtmosphere: 'self-accounting', actionStyle: 'one honest inventory' },
  { day: 16, title: 'Repentance Is a Door, Not a Wall', primaryEmotionalNote: 'repentance', dominantSpiritualMovement: 'Tawbah', cadence: 'balanced', seerahAtmosphere: 'return after error', quranAtmosphere: 'forgiveness and return', actionStyle: 'specific tawbah' },
  { day: 17, title: 'Purify the Intention', primaryEmotionalNote: 'discipline', dominantSpiritualMovement: 'Ikhlas', cadence: 'balanced', seerahAtmosphere: 'hidden sincerity', quranAtmosphere: 'intent before display', actionStyle: 'renew niyyah before act' },
  { day: 18, title: 'Guard the Tongue, Guard the Heart', primaryEmotionalNote: 'healing', dominantSpiritualMovement: 'Restraint', cadence: 'action', seerahAtmosphere: 'gentle speech', quranAtmosphere: 'speech ethics', actionStyle: 'pause before reply' },
  { day: 19, title: 'Heal Comparison and Envy', primaryEmotionalNote: 'healing', dominantSpiritualMovement: 'Inner cleansing', cadence: 'deep', seerahAtmosphere: 'content humility', quranAtmosphere: 'purity of chest', actionStyle: 'dua for who you envy' },
  { day: 20, title: 'A Softer Heart', primaryEmotionalNote: 'stillness', dominantSpiritualMovement: 'Tenderness', cadence: 'restorative', seerahAtmosphere: 'tears and compassion', quranAtmosphere: 'hearts that remember', actionStyle: 'slow dhikr minute' },
  { day: 21, title: 'Courageous Truthfulness', primaryEmotionalNote: 'awe', dominantSpiritualMovement: 'Sidq', cadence: 'action', seerahAtmosphere: 'truth under pressure', quranAtmosphere: 'truth and steadfastness', actionStyle: 'speak one honest truth gently' },
  { day: 22, title: 'Prayer as Daily Anchor', primaryEmotionalNote: 'discipline', dominantSpiritualMovement: 'Anchoring worship', cadence: 'balanced', seerahAtmosphere: 'consistent salah', quranAtmosphere: 'prayer as protection', actionStyle: 'protect one prayer time' },
  { day: 23, title: 'Quran as Daily Companion', primaryEmotionalNote: 'longing', dominantSpiritualMovement: 'Companionship', cadence: 'light', seerahAtmosphere: 'recitation in hardship', quranAtmosphere: 'healing recitation', actionStyle: 'one page with pause' },
  { day: 24, title: 'Mercy in Relationships', primaryEmotionalNote: 'mercy', dominantSpiritualMovement: 'Character embodiment', cadence: 'balanced', seerahAtmosphere: 'domestic gentleness', quranAtmosphere: 'kindness and pardon', actionStyle: 'one merciful response' },
  { day: 25, title: 'Patience in Conflict', primaryEmotionalNote: 'trust', dominantSpiritualMovement: 'Conflict restraint', cadence: 'action', seerahAtmosphere: 'forgiveness in victory', quranAtmosphere: 'restraining anger', actionStyle: 'delay reaction' },
  { day: 26, title: 'Service Opens the Heart', primaryEmotionalNote: 'gratitude', dominantSpiritualMovement: 'Service', cadence: 'light', seerahAtmosphere: 'care for vulnerable', quranAtmosphere: 'charity and compassion', actionStyle: 'hidden good deed' },
  { day: 27, title: 'Consistency Over Intensity', primaryEmotionalNote: 'hope', dominantSpiritualMovement: 'Sustainability', cadence: 'restorative', seerahAtmosphere: 'small regular acts', quranAtmosphere: 'steadfastness', actionStyle: 'choose one consistent act' },
  { day: 28, title: 'Belonging Without Performance', primaryEmotionalNote: 'reassurance', dominantSpiritualMovement: 'Community gentleness', cadence: 'balanced', seerahAtmosphere: 'brotherhood and mercy', quranAtmosphere: 'unity and humility', actionStyle: 'reach out with salam' },
  { day: 29, title: 'If You Missed Days, Return Gently', primaryEmotionalNote: 'healing', dominantSpiritualMovement: 'Re-entry', cadence: 'restorative', seerahAtmosphere: 'renewed resolve after pauses', quranAtmosphere: 'renewal and hope', actionStyle: 'restart without guilt' },
  { day: 30, title: 'This Path Continues', primaryEmotionalNote: 'stillness', dominantSpiritualMovement: 'Covenant of continuity', cadence: 'restorative', seerahAtmosphere: 'long-horizon perseverance', quranAtmosphere: 'steadfast ending', actionStyle: 'gentle 30-day intention' },
];

export const MISSED_DAY_PHILOSOPHY = {
  coreMessage: 'You can return gently. You have not failed the journey.',
  avoid: [
    'You fell behind',
    'You missed your streak',
    'Catch up now',
    'You lost momentum',
  ],
  preferred: [
    'Welcome back. Begin from today with a settled heart.',
    'You are still welcome here. Continue gently from where you are.',
    'No guilt, no pressure. Return in sincerity.',
  ],
};

export const WORLD_BUILDING_CONSISTENCY_RULES = {
  onboarding: 'Welcome with gentleness, remove performance pressure, and set calm expectations.',
  emptyStates: 'Use non-judgmental language that invites return, not deficiency framing.',
  returnFlows: 'Always say users can return gently; never mention being behind.',
  notifications: 'Use invitation language over urgency language.',
  loadingStates: 'Signal calm progress (settling, preparing, returning) rather than busy status.',
  bookmarks: 'Frame as a quiet place to return to verses, not saved achievements.',
  reflections: 'Frame as private sincerity, not journaling performance.',
  discovery: 'Frame Quran exploration as encountering guidance, not consuming content.',
};

export function getDayIdentity(day: number): DayIdentity | undefined {
  return DAY_IDENTITY_30.find((entry) => entry.day === day);
}

export function getWeekForDay(day: number): number {
  return Math.floor((Math.max(1, day) - 1) / 7) + 1;
}

function getConsecutiveRuns<T>(items: T[]): Array<{ start: number; end: number; value: T }> {
  if (items.length === 0) return [];

  const runs: Array<{ start: number; end: number; value: T }> = [];
  let start = 0;

  for (let i = 1; i <= items.length; i += 1) {
    if (i === items.length || items[i] !== items[start]) {
      runs.push({ start, end: i - 1, value: items[start] });
      start = i;
    }
  }

  return runs;
}

export function analyzeArcRisks(days: DayIdentity[]): ArcRiskReport {
  const sorted = [...days].sort((a, b) => a.day - b.day);

  const toneRuns = getConsecutiveRuns(sorted.map((d) => d.primaryEmotionalNote))
    .filter((run) => run.end - run.start + 1 >= 3)
    .map((run) => ({
      tone: run.value,
      runLength: run.end - run.start + 1,
      days: sorted.slice(run.start, run.end + 1).map((d) => d.day),
    }));

  const actionRuns = getConsecutiveRuns(sorted.map((d) => d.actionStyle))
    .filter((run) => run.end - run.start + 1 >= 3)
    .map((run) => ({
      actionStyle: run.value,
      runLength: run.end - run.start + 1,
      days: sorted.slice(run.start, run.end + 1).map((d) => d.day),
    }));

  const cadenceCounts = sorted.reduce<Record<DayCadence, number>>((acc, day) => {
    acc[day.cadence] += 1;
    return acc;
  }, {
    restorative: 0,
    light: 0,
    balanced: 0,
    deep: 0,
    action: 0,
  });

  const cadenceWarnings: string[] = [];
  if (cadenceCounts.deep > Math.ceil(sorted.length * 0.35)) {
    cadenceWarnings.push('Too many deep-intensity days can create emotional fatigue.');
  }
  if (cadenceCounts.restorative + cadenceCounts.light < Math.ceil(sorted.length * 0.30)) {
    cadenceWarnings.push('Not enough lighter/restorative days for emotional recovery.');
  }

  const weekWarnings: string[] = [];
  WEEKLY_EMOTIONAL_ARCS.forEach((weekArc) => {
    const weekDays = sorted.filter((d) => d.day >= weekArc.dayRange[0] && d.day <= weekArc.dayRange[1]);
    if (weekDays.length === 0) return;

    const uniqueTones = new Set(weekDays.map((d) => d.primaryEmotionalNote));
    if (uniqueTones.size < 3) {
      weekWarnings.push(`Week ${weekArc.week} may feel emotionally flat (only ${uniqueTones.size} dominant tones).`);
    }
  });

  return {
    repeatedToneRuns: toneRuns,
    repeatedActionStyleRuns: actionRuns,
    cadenceImbalanceWarnings: cadenceWarnings,
    weekOverlapWarnings: weekWarnings,
  };
}
