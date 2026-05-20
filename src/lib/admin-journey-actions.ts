'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServer } from './supabase-server';
import type { LessonWithBlocks, JourneyLessonMetadata, LessonBlock } from '@/types/admin-journey';

export async function saveLesson(
  lessonData: LessonWithBlocks,
  userId: string
): Promise<{ success: boolean; lessonId?: string; error?: string }> {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    
    const isAdmin = adminEmails.length > 0 
      ? adminEmails.includes(user.email?.toLowerCase() || '')
      : user.email?.endsWith('@quran.foundation');

    if (!isAdmin) {
      return { success: false, error: 'Not authorized' };
    }

    const { metadata, blocks } = lessonData;

    const lessonPayload: Record<string, unknown> = {
      day_number: metadata.day_number,
      title: metadata.title,
      subtitle: metadata.subtitle || null,
      topic: metadata.topic,
      description: metadata.description || null,
      estimated_minutes: metadata.estimated_minutes,
      is_published: metadata.is_published,
      updated_at: new Date().toISOString(),
    };

    let lessonId = metadata.id;

    if (lessonId) {
      await supabase
        .from('journey_lessons')
        .update(lessonPayload)
        .eq('id', lessonId);
    } else {
      lessonPayload.created_by = userId;
      lessonPayload.created_at = new Date().toISOString();
      
      const { data: newLesson, error: insertError } = await supabase
        .from('journey_lessons')
        .insert(lessonPayload)
        .select('id')
        .single();

      if (insertError) {
        return { success: false, error: insertError.message };
      }
      lessonId = newLesson.id;
    }

    if (blocks.length > 0) {
      await supabase
        .from('journey_lesson_blocks')
        .delete()
        .eq('lesson_id', lessonId);

      const blocksPayload = blocks.map((block: LessonBlock, index: number) => ({
        lesson_id: lessonId,
        order_index: index,
        block_type: block.block_type,
        content: block.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: blocksError } = await supabase
        .from('journey_lesson_blocks')
        .insert(blocksPayload);

      if (blocksError) {
        return { success: false, error: blocksError.message };
      }
    }

    revalidatePath('/admin/journey');
    revalidatePath('/journey');
    
    return { success: true, lessonId };
  } catch (error) {
    console.error('Error saving lesson:', error);
    return { success: false, error: 'Failed to save lesson' };
  }
}

export async function getLessonForEditing(lessonId: string): Promise<LessonWithBlocks | null> {
  try {
    const supabase = await supabaseServer();
    
    const { data: lesson, error } = await supabase
      .from('journey_lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (error || !lesson) {
      return null;
    }

    const { data: blocks, error: blocksError } = await supabase
      .from('journey_lesson_blocks')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index', { ascending: true });

    if (blocksError) {
      console.error('Error fetching blocks:', blocksError);
    }

    return {
      metadata: {
        id: lesson.id,
        day_number: lesson.day_number,
        title: lesson.title,
        subtitle: lesson.subtitle || '',
        topic: lesson.topic,
        description: lesson.description || '',
        estimated_minutes: lesson.estimated_minutes,
        is_published: lesson.is_published,
      },
      blocks: blocks || [],
    };
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return null;
  }
}

export async function getLatestDayNumber(): Promise<number> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from('journey_lessons')
    .select('day_number')
    .order('day_number', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return 1;
  }
  return data.day_number + 1;
}