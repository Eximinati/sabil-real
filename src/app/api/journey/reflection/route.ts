import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { saveReflection } from '@/lib/journey';

export async function POST(request: Request) {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, dayNumber, reflectionText } = body;

    if (!lessonId || !dayNumber || !reflectionText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await saveReflection(user.id, lessonId, dayNumber, reflectionText);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save reflection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}