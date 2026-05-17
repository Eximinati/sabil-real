import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { translationId, tafsirId } = body;

    if (!translationId || !tafsirId) {
      return NextResponse.json({ error: 'Missing translationId or tafsirId' }, { status: 400 });
    }

    const { error } = await supabase.from('user_preferences').upsert({
      user_id: user.id,
      translation_id: translationId,
      tafsir_id: tafsirId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}