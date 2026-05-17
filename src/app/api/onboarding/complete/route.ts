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
    const { completed } = body;

    // Upsert user preferences with onboarding completed
    const { error } = await supabase.from('user_preferences').upsert({
      user_id: user.id,
      translation_id: 203,
      tafsir_id: 169,
      onboarding_completed: completed === true,
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