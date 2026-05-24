import type { LessonBlock } from '@/types/admin-journey';
import {
  CANONICAL_DAY_FRAMEWORK,
  LIGHTWEIGHT_CONTENT_QA,
  SABIL_WRITING_PHILOSOPHY,
  EMOTIONAL_PACING_RULES,
  REFLECTION_PROMPT_GUIDELINES,
  SEERAH_USAGE_RULES,
  QURAN_INTEGRATION_STANDARDS,
  CONTENT_ANTI_PATTERNS,
} from './sabil-content-system';

export interface DayTemplateSection {
  id: string;
  title: string;
  keywords: string[];
  authorPrompt: string;
}

export const DAY_TEMPLATE_CONTRACT: DayTemplateSection[] = CANONICAL_DAY_FRAMEWORK.map((section) => ({
  id: section.id,
  title: section.title,
  keywords: section.keywords,
  authorPrompt: section.authorPrompt,
}));

export const EMOTIONAL_QA_CHECKLIST = LIGHTWEIGHT_CONTENT_QA;

export const SABIL_CONTENT_SYSTEM = {
  writingPhilosophy: SABIL_WRITING_PHILOSOPHY,
  canonicalDayFramework: CANONICAL_DAY_FRAMEWORK,
  emotionalPacingRules: EMOTIONAL_PACING_RULES,
  reflectionPromptGuidelines: REFLECTION_PROMPT_GUIDELINES,
  seerahUsageRules: SEERAH_USAGE_RULES,
  quranIntegrationStandards: QURAN_INTEGRATION_STANDARDS,
  antiPatterns: CONTENT_ANTI_PATTERNS,
  qaChecklist: LIGHTWEIGHT_CONTENT_QA,
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getHeadingTexts(blocks: LessonBlock[]): string[] {
  return blocks
    .filter((block) => block.block_type === 'heading')
    .map((block) => normalize(String(block.content.text || '')))
    .filter(Boolean);
}

export function getDayTemplateCoverage(dayNumber: number, blocks: LessonBlock[]) {
  const required = dayNumber >= 2 && dayNumber <= 30;
  const headings = getHeadingTexts(blocks);
  const matchedSectionIds = new Set<string>();

  for (const section of DAY_TEMPLATE_CONTRACT) {
    const matched = headings.some((heading) =>
      section.keywords.some((keyword) => heading.includes(normalize(keyword)))
    );

    if (matched) {
      matchedSectionIds.add(section.id);
    }
  }

  const missingSections = DAY_TEMPLATE_CONTRACT.filter(
    (section) => !matchedSectionIds.has(section.id)
  );

  return {
    required,
    matchedSectionIds,
    missingSections,
    sections: DAY_TEMPLATE_CONTRACT,
  };
}

export function validateDayTemplateContract(dayNumber: number, blocks: LessonBlock[]) {
  const coverage = getDayTemplateCoverage(dayNumber, blocks);

  if (!coverage.required) {
    return {
      valid: true,
      required: false,
      missingSections: [] as DayTemplateSection[],
    };
  }

  return {
    valid: coverage.missingSections.length === 0,
    required: true,
    missingSections: coverage.missingSections,
  };
}

export function createStarterTemplateBlocks(dayNumber: number): LessonBlock[] {
  const blocks: LessonBlock[] = [];

  blocks.push({
    order_index: 0,
    block_type: 'heading',
    content: {
      text: `Day ${dayNumber} journey draft`,
      level: 1,
    },
  });

  let orderIndex = 1;

  DAY_TEMPLATE_CONTRACT.forEach((section) => {
    blocks.push({
      order_index: orderIndex++,
      block_type: 'heading',
      content: {
        text: section.title,
        level: 2,
      },
    });

    blocks.push({
      order_index: orderIndex++,
      block_type: 'paragraph',
      content: {
        text: section.authorPrompt,
      },
    });
  });

  blocks.push({
    order_index: orderIndex,
    block_type: 'reflection',
    content: {
      prompts: ['What is one honest thing your heart needs to bring to Allah today?'],
    },
  });

  return blocks;
}
