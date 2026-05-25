export interface UrduLocalizationExample {
  surface: string;
  bad: string;
  better: string;
  note: string;
}

export interface UrduLocalizationChecklistItem {
  id: string;
  label: string;
}

export const URDU_TONE_PRINCIPLES = [
  'Speak as gentle companion, not authority podium.',
  'Warmth before instruction.',
  'Sincerity before performance.',
  'Use modern accessible Urdu.',
  'Keep reader emotionally safe to return.',
];

export const URDU_FORBIDDEN_PATTERNS = [
  'Literal word-by-word translation from English.',
  'Institutional or bureaucratic language.',
  'Khutbah-heavy lecture voice.',
  'Guilt-driven or shame-driven phrasing.',
  'Sectarian assumptions about reader background.',
  'Productivity framing for worship.',
  'Excessive Arabic insertion when plain Urdu works.',
];

export const URDU_READABILITY_STANDARDS = [
  'Sentence target: 8-18 words.',
  'Paragraph target: 1-3 sentences for mobile comfort.',
  'One emotional move per sentence.',
  'Prefer high-frequency Urdu vocabulary.',
  'Break dense ideas into short contemplative lines.',
];

export const URDU_EMOTIONAL_EQUIVALENCE_RULES = [
  'Preserve emotional intent, not literal syntax.',
  'Keep same tenderness level as source.',
  'Adapt flow for natural Urdu rhythm.',
  'Prefer invitation over command.',
  'Close with soft landing and return energy.',
];

export const URDU_REFLECTION_PROMPT_RULES = [
  'Prompt should feel private and gentle.',
  'Invite honesty without emotional invasion.',
  'Avoid therapy-clinical framing.',
  'Avoid self-help coaching tone.',
  'Avoid guilt framing or performance checks.',
];

export const URDU_WORLD_BUILDING_RULES = [
  'Loading lines should feel calm and patient.',
  'Onboarding should emphasize welcome and ease.',
  'Return flows must avoid "behind" language.',
  'Empty states should feel hopeful, not deficient.',
  'Navigation labels should stay simple and human.',
];

export const URDU_GOOD_BAD_EXAMPLES: UrduLocalizationExample[] = [
  {
    surface: 'onboarding',
    bad: 'آپ کو روزانہ دینی اسباق مکمل کرنے چاہئیں۔',
    better: 'ہر دن ایک نرم قدم کافی ہے۔ جہاں سے دل تیار ہو، وہیں سے شروع کریں۔',
    note: 'Shift from pressure to welcome.',
  },
  {
    surface: 'reflection prompt',
    bad: 'اپنی کوتاہیوں کا اعتراف کریں اور اصلاح کریں۔',
    better: 'آج دل کے کس حصے کو اللہ کے سامنے نرمی سے کھولنا چاہتے ہیں؟',
    note: 'Private honesty, no judgment.',
  },
  {
    surface: 'return flow',
    bad: 'آپ کئی دن پیچھے رہ گئے ہیں۔',
    better: 'آپ واپس آئے، یہی بڑی بات ہے۔ آج سے نرمی سے پھر شروع کریں۔',
    note: 'Remove shame, preserve hope.',
  },
  {
    surface: 'tiny action',
    bad: 'آج کم از کم 20 منٹ لازمی عبادت کریں۔',
    better: 'آج ایک چھوٹا سا عمل چنیں، جو دل سکون سے نبھا سکے۔',
    note: 'Gentle action over rigid quota.',
  },
  {
    surface: 'reassurance',
    bad: 'آپ کو اللہ تعالیٰ کی طرف رجوع کرنا چاہیے۔',
    better: 'اللہ اب بھی آپ کو اپنی طرف بلاتا ہے۔',
    note: 'Nearness language over command.',
  },
  {
    surface: 'quran framing',
    bad: 'مندرجہ ذیل آیات کا مطالعہ فرمائیں۔',
    better: 'ان آیات کے ساتھ تھوڑی دیر ٹھہریں۔',
    note: 'Contemplative invitation over institutional wording.',
  },
  {
    surface: 'navigation',
    bad: 'منعکسات',
    better: 'تاملات',
    note: 'Use familiar emotional vocabulary.',
  },
];

export const URDU_EMOTIONAL_QA_CHECKLIST: UrduLocalizationChecklistItem[] = [
  { id: 'warmth', label: 'Feels warm and human, not robotic.' },
  { id: 'softness', label: 'No shame, blame, or pressure tone.' },
  { id: 'readability', label: 'Easy to read on mobile in one pass.' },
  { id: 'breathing-room', label: 'Lines have calm breathing rhythm.' },
  { id: 'non-institutional', label: 'Avoids sermon/admin style wording.' },
  { id: 'beginner-safe', label: 'Safe for spiritually fragile beginner.' },
  { id: 'spiritual-intimacy', label: 'Invites sincere nearness to Allah.' },
  { id: 'coherence', label: 'Matches rest of Sabil emotional atmosphere.' },
  { id: 'return-energy', label: 'Leaves reader safe to return tomorrow.' },
];
