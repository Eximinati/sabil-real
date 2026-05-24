export interface WritingPhilosophy {
  tone: string[];
  emotionalGoals: string[];
  pacingPhilosophy: string[];
  teachingPhilosophy: string[];
  transformationPhilosophy: string[];
  avoid: string[];
  prioritize: string[];
  toneExamples: {
    good: string[];
    avoid: string[];
  };
}

export interface CanonicalDaySection {
  id: string;
  title: string;
  order: number;
  emotionalPurpose: string;
  idealMinutes: string;
  pacingGoal: string;
  transitionPhilosophy: string;
  keywords: string[];
  authorPrompt: string;
}

export interface GuidelineSet {
  do: string[];
  avoid: string[];
  examples?: string[];
}

export const SABIL_WRITING_PHILOSOPHY: WritingPhilosophy = {
  tone: [
    'Gentle, grounded, and sincere',
    'Human before instructional',
    'Clear and beginner-friendly without flattening spiritual depth',
  ],
  emotionalGoals: [
    'Safety before challenge',
    'Hope before correction',
    'Sincerity before performance',
    'Quiet curiosity for tomorrow',
  ],
  pacingPhilosophy: [
    'Alternate guidance and stillness',
    'Limit information bursts to short segments',
    'Use transitions that soften emotional movement',
    'End calmer than the beginning',
  ],
  teachingPhilosophy: [
    'Explain Islam as an invitation, not a confrontation',
    'Teach from lived meaning before technical terminology',
    'Anchor in Quran and Seerah with emotional relevance',
    'Preserve scholarly depth through optional tafsir, not dense walls',
  ],
  transformationPhilosophy: [
    'Transformation is gradual, merciful, and relational',
    'Each day should move one sincere step, not produce instant change',
    'The goal is closeness to Allah, not streaks or completion scores',
  ],
  avoid: [
    'Shame-driven language',
    'Corporate growth framing',
    'Preachy or performative religious tone',
    'Sectarian argumentation',
    'Assuming prior Arabic or scholarly literacy',
  ],
  prioritize: [
    'Emotional safety',
    'Spiritual intimacy',
    'Coherent pacing',
    'Beginner readability',
    'Quran-centered reflection',
  ],
  toneExamples: {
    good: [
      'You are not behind. Return gently, and begin from where you are.',
      'Take a quiet breath before we read. Let this verse meet you where you are.',
      'If this feels heavy, pause. Allah is not asking for perfection in one night.',
    ],
    avoid: [
      'If you were serious, you would already be doing this daily.',
      'Complete this step now to maintain your momentum and growth metrics.',
      'Real believers never struggle with this.',
    ],
  },
};

export const CANONICAL_DAY_FRAMEWORK: CanonicalDaySection[] = [
  {
    id: 'arrival',
    title: 'Arrival moment',
    order: 1,
    emotionalPurpose: 'Help the reader enter calmly and feel welcomed.',
    idealMinutes: '0.5-1.5',
    pacingGoal: 'Stillness before instruction.',
    transitionPhilosophy: 'From noise to presence.',
    keywords: ['arrival', 'enter', 'begin', 'settle'],
    authorPrompt: 'Use one soft sentence, one subtle ayah, and spacious rhythm.',
  },
  {
    id: 'opening-reflection',
    title: 'Opening reflection',
    order: 2,
    emotionalPurpose: 'Open the heart before teaching begins.',
    idealMinutes: '1-2',
    pacingGoal: 'Human resonance over information.',
    transitionPhilosophy: 'From presence to meaning.',
    keywords: ['opening reflection', 'before we begin', 'opening'],
    authorPrompt: 'Write as a compassionate companion, not a lecturer.',
  },
  {
    id: 'seerah',
    title: 'Seerah moment',
    order: 3,
    emotionalPurpose: 'Offer a human Prophetic mirror for the reader.',
    idealMinutes: '1-2',
    pacingGoal: 'Story pulse without timeline overload.',
    transitionPhilosophy: 'From inner state to Prophetic companionship.',
    keywords: ['seerah', 'prophetic moment', 'prophet', 'sirah'],
    authorPrompt: 'Use one emotionally resonant moment and one takeaway sentence.',
  },
  {
    id: 'quran',
    title: 'Quran reflection',
    order: 4,
    emotionalPurpose: 'Center the day around direct encounter with Allah’s words.',
    idealMinutes: '2-4',
    pacingGoal: 'Depth over quantity (typically 1-5 verses).',
    transitionPhilosophy: 'From story to revelation.',
    keywords: ['quran', 'ayat', 'verses'],
    authorPrompt: 'Frame the verses gently before displaying Arabic and translation.',
  },
  {
    id: 'tafsir',
    title: 'Tafsir support',
    order: 5,
    emotionalPurpose: 'Offer scholar context without replacing reflection.',
    idealMinutes: '1-2',
    pacingGoal: 'Progressive reveal, condensed by default.',
    transitionPhilosophy: 'From encounter to clarification.',
    keywords: ['tafsir', 'scholar context', 'deeper context'],
    authorPrompt: 'Keep tafsir optional and short; preserve emotional center.',
  },
  {
    id: 'hadith',
    title: 'Hadith connection',
    order: 6,
    emotionalPurpose: 'Reinforce mercy and closeness through one Prophetic saying.',
    idealMinutes: '0.5-1.5',
    pacingGoal: 'One hadith only.',
    transitionPhilosophy: 'From explanation to prophetic reassurance.',
    keywords: ['hadith', 'prophetic reminder'],
    authorPrompt: 'Choose one short hadith and keep presentation uncluttered.',
  },
  {
    id: 'reflection',
    title: 'Private reflection',
    order: 7,
    emotionalPurpose: 'Create emotionally safe private honesty with Allah.',
    idealMinutes: '1-3',
    pacingGoal: 'Open prompt, no pressure.',
    transitionPhilosophy: 'From receiving to responding.',
    keywords: ['reflection', 'journal', 'for your heart'],
    authorPrompt: 'Use one compassionate prompt that invites sincerity.',
  },
  {
    id: 'action',
    title: 'Tiny action',
    order: 8,
    emotionalPurpose: 'Translate reflection into one lived step.',
    idealMinutes: '0.5-1',
    pacingGoal: 'Single gentle action.',
    transitionPhilosophy: 'From heart insight to lived sincerity.',
    keywords: ['tiny action', 'gentle action', 'for tonight', 'today'],
    authorPrompt: 'Give one small real-world action free of checklist tone.',
  },
  {
    id: 'closing',
    title: 'Closing moment',
    order: 9,
    emotionalPurpose: 'Leave the reader peaceful, hopeful, and willing to return.',
    idealMinutes: '0.5-1.5',
    pacingGoal: 'Soft ending with subtle invitation to Day N+1.',
    transitionPhilosophy: 'From effort to trust.',
    keywords: ['closing', 'dua', 'next day', 'return tomorrow'],
    authorPrompt: 'Close with a short dua-like line and gentle continuation cue.',
  },
];

export const EMOTIONAL_PACING_RULES: string[] = [
  'Start with stillness, not information density.',
  'Place the highest emotional intensity around Quran encounter and private reflection.',
  'Insert micro-breaths after heavy paragraphs (short lines, visual space, gentle transitions).',
  'Never stack Seerah + dense tafsir + long legal discussion without pause.',
  'Keep practical action tiny and pressure-free.',
  'Close with emotional downshift and hope.',
];

export const REFLECTION_PROMPT_GUIDELINES: GuidelineSet = {
  do: [
    'Ask open, honest, spiritually grounded questions.',
    'Use gentle second-person language (you/your heart).',
    'Invite sincerity before Allah, not public performance.',
    'Keep prompts specific enough to evoke real emotion.',
  ],
  avoid: [
    'Therapy-role language or clinical diagnosis framing.',
    'Corporate coaching phrasing and optimization language.',
    'Guilt-heavy prompts that imply spiritual failure.',
    'Rigid task phrasing that feels like homework submission.',
  ],
  examples: [
    'What burden have you been carrying silently lately?',
    'Where do you most need Allah’s mercy this week?',
  ],
};

export const SEERAH_USAGE_RULES: GuidelineSet = {
  do: [
    'Use one emotionally resonant scene per day.',
    'Highlight human moments: uncertainty, patience, trust, mercy.',
    'Connect the moment to the learner’s present emotional state.',
    'End with one reflective bridge sentence into Quran reading.',
  ],
  avoid: [
    'Chronological timeline dumping.',
    'Trivia-heavy names/dates without spiritual relevance.',
    'Academic biography voice detached from lived meaning.',
    'Overloading one day with multiple unrelated Seerah episodes.',
  ],
};

export const QURAN_INTEGRATION_STANDARDS: GuidelineSet = {
  do: [
    'Default to 1-5 verses per day for reflective depth.',
    'Introduce verses with emotional framing before display.',
    'Preserve Arabic prominence with generous spacing and calm typography.',
    'Show translation clearly and avoid dense annotation at first glance.',
    'Reveal tafsir progressively with condensed-first behavior.',
  ],
  avoid: [
    'Long verse lists in a single day.',
    'API/data-style presentation that feels technical.',
    'Immediate heavy tafsir walls before reflective reading.',
    'Treating Quran as content volume to consume quickly.',
  ],
};

export const CONTENT_ANTI_PATTERNS: string[] = [
  'Information overload blocks longer than the reader can emotionally hold.',
  'Sectarian dispute framing and polemical arguments.',
  'Guilt-driven motivational language.',
  'Achievement psychology and completion gamification.',
  'Excessive jargon without plain-language explanation.',
  'Harsh correction tone toward beginners or struggling users.',
  'Overwhelming legal detail detached from spiritual context.',
  'Academic abstraction without emotional anchoring.',
];

export const LIGHTWEIGHT_CONTENT_QA = [
  { id: 'emotionally-safe', label: 'Does this day feel emotionally safe for a struggling beginner?' },
  { id: 'coherent-flow', label: 'Does the day flow as one journey instead of separate widgets?' },
  { id: 'pacing-balanced', label: 'Are there clear moments of stillness, depth, and breathing room?' },
  { id: 'quran-central', label: 'Does Quran remain central and spiritually encountered, not consumed?' },
  { id: 'seerah-human', label: 'Is Seerah presented as human resonance, not timeline trivia?' },
  { id: 'tafsir-light', label: 'Is tafsir supportive, optional, and not overwhelming by default?' },
  { id: 'reflection-sincere', label: 'Does reflection invite sincerity without guilt or productivity pressure?' },
  { id: 'beginner-safe', label: 'Is language accessible to users with no prior Islamic background?' },
  { id: 'gentle-action', label: 'Is the tiny action gentle and realistic for daily life?' },
  { id: 'peaceful-close', label: 'Does the ending leave the user calmer and willing to return tomorrow?' },
];
