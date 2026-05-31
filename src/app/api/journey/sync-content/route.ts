import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { parseMarkdownToBlocks } from '@/lib/markdown-importer';
import { getDayIdentity } from '@/lib/journey-emotional-arc';
import { loadJourneyDayBundles } from '@/lib/journey-content-files';
import type { LanguageCode } from '@/lib/i18n/config';
import { normalizeTranslationStages } from '@/lib/journey-editorial';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ParsedBlock {
  order_index: number;
  block_type: string;
  content: Record<string, unknown>;
}

const LOCALIZABLE_BLOCK_KEYS = [
  'text',
  'prompt',
  'prompts',
  'items',
  'source',
  'translation',
  'transliteration',
] as const;

function parseFirstHeading(markdown: string): string | null {
  return markdown
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('# '))
    ?.replace(/^#\s+/, '')
    .trim() || null;
}

function parseDayTitle(markdown: string): { dayNumber: number; title: string } | null {
  const content = parseFirstHeading(markdown);
  if (!content) {
    return null;
  }

  const match = content.match(/^Day\s*(\d+)\s*[-:]\s*(.+)$/i);
  if (!match) return null;

  const dayNumber = parseInt(match[1], 10);
  if (!Number.isFinite(dayNumber)) return null;

  return {
    dayNumber,
    title: match[2].trim(),
  };
}

function parseDayTitleWithFallback(markdown: string, fallbackDayNumber: number, fallbackTitle: string): { dayNumber: number; title: string } {
  const parsed = parseDayTitle(markdown);
  if (parsed) {
    return parsed;
  }

  const firstHeading = parseFirstHeading(markdown);
  if (firstHeading) {
    return {
      dayNumber: fallbackDayNumber,
      title: firstHeading,
    };
  }

  return {
    dayNumber: fallbackDayNumber,
    title: fallbackTitle,
  };
}

function parseLocalizedTitle(markdown: string): string | null {
  const heading = parseFirstHeading(markdown);
  if (!heading) {
    return null;
  }

  const match = heading.match(/^Day\s*\d+\s*[-:]\s*(.+)$/i);
  if (match) {
    return match[1].trim();
  }

  const urduMatch = heading.match(/^دن\s*\d+\s*[-:،]?\s*(.+)$/i);
  if (urduMatch) {
    return urduMatch[1].trim();
  }

  return heading.trim();
}

function extractSectionText(
  markdown: string,
  heading: string | string[],
  options: { skipQuotedParagraph?: boolean } = {}
): string {
  const headingCandidates = Array.isArray(heading) ? heading : [heading];
  const normalized = markdown.replace(/\r\n/g, '\n');
  let sectionBody = '';

  for (const headingCandidate of headingCandidates) {
    const parts = normalized.split(`## ${headingCandidate}`);
    if (parts.length < 2) {
      continue;
    }

    const afterHeading = parts[1];
    sectionBody = afterHeading.split('\n## ')[0].trim();
    if (sectionBody) {
      break;
    }
  }

  if (!sectionBody) return '';

  const skipQuotedParagraph = options.skipQuotedParagraph !== false;

  const firstParagraph = sectionBody
    .split('\n\n')
    .map((block) => block.trim())
    .find((block) => block.length > 0 && (!skipQuotedParagraph || !block.startsWith('"')));

  return (firstParagraph || sectionBody)
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasMeaningfulValue(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.some((item) => hasMeaningfulValue(item));
  }
  return value !== null && value !== undefined;
}

function pickLocalizableBlockContent(content: Record<string, unknown>): Record<string, unknown> {
  const picked: Record<string, unknown> = {};

  for (const key of LOCALIZABLE_BLOCK_KEYS) {
    const value = content[key];
    if (hasMeaningfulValue(value)) {
      picked[key] = value;
    }
  }

  return picked;
}

function mergeLocalizedBlocks(
  baseBlocks: ParsedBlock[],
  localizedBlocks: ParsedBlock[],
  language: LanguageCode
): ParsedBlock[] {
  return baseBlocks.map((baseBlock, index) => {
    const localizedBlock = localizedBlocks[index];
    if (!localizedBlock || localizedBlock.block_type !== baseBlock.block_type) {
      return baseBlock;
    }

    const localizedContent = pickLocalizableBlockContent(localizedBlock.content || {});
    if (Object.keys(localizedContent).length === 0) {
      return baseBlock;
    }

    const baseContent = (baseBlock.content || {}) as Record<string, unknown>;
    const existingI18n = (baseContent.i18n || {}) as Record<string, Record<string, unknown>>;

    return {
      ...baseBlock,
      content: {
        ...baseContent,
        i18n: {
          ...existingI18n,
          [language]: localizedContent,
        },
      },
    };
  });
}

export async function POST() {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    const isAdmin = adminEmails.length > 0
      ? adminEmails.includes(user.email?.toLowerCase() || '')
      : user.email?.endsWith('@quran.foundation');

    if (!isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const dayBundles = await loadJourneyDayBundles(1, 30);
    if (dayBundles.length === 0) {
      return NextResponse.json({ error: 'No journey day files found in structured or legacy paths' }, { status: 404 });
    }

    const results: Array<{
      day: number;
      lessonId?: string;
      blocks: number;
      status: string;
      source?: string;
      languages?: string[];
      error?: string;
    }> = [];

    for (const dayBundle of dayBundles) {
      try {
        const englishMarkdown = dayBundle.markdownByLanguage.en;
        if (!englishMarkdown) {
          throw new Error(`Missing English markdown for day ${dayBundle.dayNumber}`);
        }

        const parsedTitle = parseDayTitleWithFallback(
          englishMarkdown,
          dayBundle.dayNumber,
          `Day ${dayBundle.dayNumber}`
        );

        const parsedEn = await parseMarkdownToBlocks(englishMarkdown, false);
        const reflectionPrompt = dayBundle.reflectionPrompt || extractSectionText(englishMarkdown, ['Private reflection', 'Reflection for the heart']);
        const openingSummary = dayBundle.description || extractSectionText(englishMarkdown, 'Opening reflection');
        const hadithText = extractSectionText(
          englishMarkdown,
          ['Hadith connection', 'A Prophetic reminder', 'Related Hadith'],
          { skipQuotedParagraph: false }
        );
        const dayIdentity = getDayIdentity(dayBundle.dayNumber);
        const canonicalJourney = dayBundle.metadata.canonical_journey;
        const sacredRefs = canonicalJourney?.sacred_source_refs;

        const verseKeys =
          sacredRefs?.verse_keys && sacredRefs.verse_keys.length > 0
            ? sacredRefs.verse_keys
            : parsedEn.verseReferences;

        const hadithCollection = sacredRefs?.hadith_collection || null;
        const hadithNumber = sacredRefs?.hadith_number || null;
        const hadithSource = sacredRefs?.hadith_source || null;

        let mergedBlocks = parsedEn.blocks as ParsedBlock[];
        const localizedContent: Record<string, Record<string, unknown>> = dayBundle.localized_content || {};

        const urduMarkdown = dayBundle.markdownByLanguage.ur;
        if (urduMarkdown) {
          const parsedUr = await parseMarkdownToBlocks(urduMarkdown, false);
          mergedBlocks = mergeLocalizedBlocks(mergedBlocks, parsedUr.blocks as ParsedBlock[], 'ur');

          const urduTitle = parseLocalizedTitle(urduMarkdown);
          const urduOpeningSummary = extractSectionText(urduMarkdown, [
            'Opening reflection',
            'ابتدائی تامل',
            'ابتدائی غور',
          ]);
          const urduReflectionPrompt = extractSectionText(urduMarkdown, [
            'Private reflection',
            'دل کا تامل',
            'نجی تامل',
          ]);

          const urduFields: Record<string, unknown> = {};
          if (urduTitle) {
            urduFields.title = urduTitle;
          }
          if (urduOpeningSummary) {
            urduFields.description = urduOpeningSummary;
          }
          if (urduReflectionPrompt) {
            urduFields.reflection_prompt = urduReflectionPrompt;
          }

          if (Object.keys(urduFields).length > 0) {
            localizedContent.ur = urduFields;
          }
        }

        const { data: existingLesson } = await supabase
          .from('journey_lessons')
          .select('id')
          .eq('day_number', dayBundle.dayNumber)
          .maybeSingle();

        if (existingLesson) {
          results.push({
            day: dayBundle.dayNumber,
            lessonId: existingLesson.id,
            blocks: 0,
            status: 'skipped-existing',
            source: dayBundle.source,
            languages: Object.keys(dayBundle.markdownByLanguage),
          });
          continue;
        }

        const lessonPayload = {
          day_number: dayBundle.dayNumber,
          title: dayBundle.title || parsedTitle.title,
          subtitle: null,
          topic: dayIdentity
            ? `${dayIdentity.primaryEmotionalNote} - ${dayIdentity.dominantSpiritualMovement}`
            : 'Guided spiritual journey',
          description: openingSummary || null,
          verse_keys: verseKeys,
          lesson_text: null,
          hadith_text: hadithText || null,
          hadith_source: hadithSource,
          hadith_collection: hadithCollection,
          hadith_number: hadithNumber,
          reflection_prompt: reflectionPrompt || null,
          estimated_minutes: dayBundle.metadata.estimated_minutes ?? 10,
          localized_content: Object.keys(localizedContent).length > 0 ? localizedContent : null,
          translation_status: normalizeTranslationStages(dayBundle.translationStatus, {
            hasContentByLanguage: {
              en: true,
              ur: Boolean(dayBundle.markdownByLanguage.ur),
            },
            isPublished: false,
          }),
          shared_metadata: dayBundle.metadata,
          is_published: false,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertError } = await supabase
          .from('journey_lessons')
          .insert(lessonPayload)
          .select('id')
          .single();

        if (insertError || !inserted) {
          throw new Error(insertError?.message || 'Failed to create lesson');
        }

        const lessonId = inserted.id;

        if (!lessonId) {
          throw new Error('Missing lesson id after upsert');
        }

        await supabase
          .from('journey_lesson_blocks')
          .delete()
          .eq('lesson_id', lessonId);

        if (mergedBlocks.length > 0) {
          const blockPayload = mergedBlocks.map((block, index) => ({
            lesson_id: lessonId,
            order_index: index,
            block_type: block.block_type,
            content: block.content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const { error: blockInsertError } = await supabase
            .from('journey_lesson_blocks')
            .insert(blockPayload);

          if (blockInsertError) {
            throw new Error(blockInsertError.message);
          }
        }

        results.push({
          day: dayBundle.dayNumber,
          lessonId,
          blocks: mergedBlocks.length,
          status: 'ok',
          source: dayBundle.source,
          languages: Object.keys(dayBundle.markdownByLanguage),
        });
      } catch (error) {
        results.push({
          day: dayBundle.dayNumber,
          blocks: 0,
          status: 'failed',
          source: dayBundle.source,
          languages: Object.keys(dayBundle.markdownByLanguage),
          error: error instanceof Error ? error.message : 'Unknown sync error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      synced: results.filter((r) => r.status === 'ok').length,
      failed: results.filter((r) => r.status === 'failed').length,
      editorialSummary: {
        draftLocalized: results.filter((r) => r.status === 'ok' && r.languages?.includes('ur')).length,
        untranslated: results.filter((r) => r.status === 'ok' && !r.languages?.includes('ur')).length,
      },
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync content';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
