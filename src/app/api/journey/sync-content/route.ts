import { NextResponse } from 'next/server';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { supabaseServer } from '@/lib/supabase-server';
import { parseMarkdownToBlocks } from '@/lib/markdown-importer';
import { getDayIdentity } from '@/lib/journey-emotional-arc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ParsedDayFile {
  dayNumber: number;
  title: string;
  markdown: string;
}

function parseDayTitle(markdown: string): { dayNumber: number; title: string } | null {
  const firstLine = markdown.split('\n').find((line) => line.trim().startsWith('# '));
  if (!firstLine) return null;

  const content = firstLine.replace(/^#\s+/, '').trim();
  const match = content.match(/^Day\s*(\d+)\s*[-:]\s*(.+)$/i);
  if (!match) return null;

  const dayNumber = parseInt(match[1], 10);
  if (!Number.isFinite(dayNumber)) return null;

  return {
    dayNumber,
    title: match[2].trim(),
  };
}

function extractSectionText(markdown: string, heading: string): string {
  const normalized = markdown.replace(/\r\n/g, '\n');
  const parts = normalized.split(`## ${heading}`);
  if (parts.length < 2) return '';

  const afterHeading = parts[1];
  const sectionBody = afterHeading.split('\n## ')[0].trim();
  if (!sectionBody) return '';

  const firstParagraph = sectionBody
    .split('\n\n')
    .map((block) => block.trim())
    .find((block) => block.length > 0 && !block.startsWith('"'));

  return (firstParagraph || sectionBody)
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadDayFiles(): Promise<ParsedDayFile[]> {
  const contentDir = path.join(process.cwd(), 'content', 'journey');
  const files = await readdir(contentDir);

  const targets = files
    .filter((file) => {
      const match = file.match(/^day(\d+)\.md$/i);
      if (!match) return false;
      const day = parseInt(match[1], 10);
      return day >= 2 && day <= 30;
    })
    .sort((a, b) => {
      const dayA = parseInt((a.match(/^day(\d+)\.md$/i) || [])[1] || '0', 10);
      const dayB = parseInt((b.match(/^day(\d+)\.md$/i) || [])[1] || '0', 10);
      return dayA - dayB;
    });

  const parsed: ParsedDayFile[] = [];

  for (const fileName of targets) {
    const filePath = path.join(contentDir, fileName);
    const markdown = await readFile(filePath, 'utf-8');
    const titleData = parseDayTitle(markdown);
    if (!titleData) continue;

    parsed.push({
      dayNumber: titleData.dayNumber,
      title: titleData.title,
      markdown,
    });
  }

  return parsed;
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

    const dayFiles = await loadDayFiles();
    if (dayFiles.length === 0) {
      return NextResponse.json({ error: 'No day2-day30 markdown files found' }, { status: 404 });
    }

    const results: Array<{ day: number; lessonId?: string; blocks: number; status: string; error?: string }> = [];

    for (const dayFile of dayFiles) {
      try {
        const parsed = await parseMarkdownToBlocks(dayFile.markdown, false);
        const reflectionPrompt = extractSectionText(dayFile.markdown, 'Private reflection');
        const openingSummary = extractSectionText(dayFile.markdown, 'Opening reflection');
        const dayIdentity = getDayIdentity(dayFile.dayNumber);

        const { data: existingLesson } = await supabase
          .from('journey_lessons')
          .select('id, is_published')
          .eq('day_number', dayFile.dayNumber)
          .maybeSingle();

        const lessonPayload = {
          day_number: dayFile.dayNumber,
          title: dayFile.title,
          subtitle: null,
          topic: dayIdentity
            ? `${dayIdentity.primaryEmotionalNote} - ${dayIdentity.dominantSpiritualMovement}`
            : 'Guided spiritual journey',
          description: openingSummary || null,
          verse_keys: parsed.verseReferences,
          lesson_text: null,
          hadith_text: null,
          hadith_source: null,
          hadith_collection: null,
          hadith_number: null,
          reflection_prompt: reflectionPrompt || null,
          estimated_minutes: 10,
          is_published: existingLesson?.is_published ?? false,
          updated_at: new Date().toISOString(),
        };

        let lessonId: string | null = existingLesson?.id || null;

        if (lessonId) {
          const { error: updateError } = await supabase
            .from('journey_lessons')
            .update(lessonPayload)
            .eq('id', lessonId);

          if (updateError) {
            throw new Error(updateError.message);
          }
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from('journey_lessons')
            .insert({ ...lessonPayload, created_by: user.id, created_at: new Date().toISOString() })
            .select('id')
            .single();

          if (insertError || !inserted) {
            throw new Error(insertError?.message || 'Failed to create lesson');
          }

          lessonId = inserted.id;
        }

        if (!lessonId) {
          throw new Error('Missing lesson id after upsert');
        }

        await supabase
          .from('journey_lesson_blocks')
          .delete()
          .eq('lesson_id', lessonId);

        if (parsed.blocks.length > 0) {
          const blockPayload = parsed.blocks.map((block, index) => ({
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
          day: dayFile.dayNumber,
          lessonId,
          blocks: parsed.blocks.length,
          status: 'ok',
        });
      } catch (error) {
        results.push({
          day: dayFile.dayNumber,
          blocks: 0,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown sync error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      synced: results.filter((r) => r.status === 'ok').length,
      failed: results.filter((r) => r.status === 'failed').length,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync content';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
