import type { LanguageCode } from '@/lib/i18n/config';
import type {
  JourneyLocalizedContentMap,
  JourneySharedMetadata,
  JourneyTranslationStatusMap,
} from './journey-localization';

export type BlockType = 
  | 'heading' 
  | 'paragraph' 
  | 'reflection' 
  | 'arabic' 
  | 'transliteration' 
  | 'verse' 
  | 'quote' 
  | 'list';

export interface LessonBlock {
  id?: string;
  order_index: number;
  block_type: BlockType;
  content: BlockContent;
}

export interface RichTextSegment {
  type: 'text' | 'bold' | 'italic' | 'inline';
  text: string;
  url?: string;
}

export interface BlockContent {
  text?: string;
  level?: number;
  items?: string[];
  verse_key?: string;
  source?: string;
  prompt?: string;
  prompts?: string[];
  transliteration?: string;
  translation?: string;
  richText?: RichTextSegment[];
  arabic_text?: string;
  i18n?: Partial<Record<LanguageCode, Partial<Omit<BlockContent, 'i18n'>>>>;
}

export interface JourneyLessonMetadata {
  id?: string;
  day_number: number;
  title: string;
  subtitle: string;
  topic: string;
  description: string;
  estimated_minutes: number;
  is_published: boolean;
  emotional_qa?: Record<string, boolean>;
  localized_content?: JourneyLocalizedContentMap;
  translation_status?: JourneyTranslationStatusMap;
  shared_metadata?: JourneySharedMetadata;
}

export interface LessonWithBlocks {
  metadata: JourneyLessonMetadata;
  blocks: LessonBlock[];
}

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  heading: 'Heading',
  paragraph: 'Paragraph',
  reflection: 'Reflection Prompt',
  arabic: 'Arabic Text',
  transliteration: 'Transliteration',
  verse: 'Quran Verse',
  quote: 'Quote',
  list: 'Bullet List',
};

export const BLOCK_TYPE_ICONS: Record<BlockType, string> = {
  heading: 'H',
  paragraph: '¶',
  reflection: '?',
  arabic: 'ع',
  transliteration: 'T',
  verse: '✦',
  quote: '"',
  list: '•',
};

export function createEmptyBlock(type: BlockType, orderIndex: number): LessonBlock {
  const baseContent: Record<BlockType, BlockContent> = {
    heading: { text: '', level: 2 },
    paragraph: { text: '', richText: [] },
    reflection: { prompts: [''] },
    arabic: { text: '' },
    transliteration: { text: '', translation: '' },
    verse: { verse_key: '' },
    quote: { text: '', source: '' },
    list: { items: [''] },
  };

  return {
    order_index: orderIndex,
    block_type: type,
    content: baseContent[type],
  };
}
