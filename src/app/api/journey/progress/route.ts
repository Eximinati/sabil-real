import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf';
import { startLesson, completeLesson } from '@/lib/journey';

export async function POST(request: Request) {
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
    const { lessonId, dayNumber, action } = body;

    if (!lessonId || !dayNumber || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'start') {
      await startLesson(user.id, lessonId, dayNumber);
    } else if (action === 'complete') {
      await completeLesson(user.id, lessonId, dayNumber);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update progress';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}