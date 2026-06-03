import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf';
import { withRateLimit } from '@/lib/rate-limit';

const handler = async (request: Request) => {
  if (!validateCsrf(request).valid) {
    return csrfErrorResponse();
  }

  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, dayNumber, reflectionText, lastUpdatedAt } = body;

    if (!lessonId || !dayNumber || reflectionText === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!reflectionText.trim()) {
      const { error: deleteError } = await supabase
        .from('user_reflections')
        .delete()
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId);

      if (deleteError) {
        console.error('Reflection delete error:', deleteError);
        return NextResponse.json({ error: 'Failed to delete reflection' }, { status: 500 });
      }

      return NextResponse.json({ success: true, deleted: true });
    }

    if (lastUpdatedAt) {
      const { data: existing } = await supabase
        .from('user_reflections')
        .select('updated_at')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .single();

      if (existing && existing.updated_at !== lastUpdatedAt) {
        return NextResponse.json(
          { error: 'Reflection was modified by another session' },
          { status: 409 }
        );
      }
    }

    const now = new Date().toISOString();
    const { error: upsertError } = await supabase.from('user_reflections').upsert({
      user_id: user.id,
      lesson_id: lessonId,
      day_number: dayNumber,
      reflection_text: reflectionText,
      updated_at: now,
    }, { onConflict: 'user_id,lesson_id' });

    if (upsertError) {
      console.error('Reflection save error:', upsertError);
      return NextResponse.json({ error: 'Failed to save reflection' }, { status: 500 });
    }

    return NextResponse.json({ success: true, updatedAt: now });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save reflection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

export const POST = withRateLimit(handler, 'reflection');