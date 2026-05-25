import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

type ReminderLanguage = 'auto' | 'en' | 'ur';

function parseReminderLanguage(value: unknown): ReminderLanguage {
  if (value === 'en' || value === 'ur') {
    return value;
  }

  return 'auto';
}

function parseReminderTime(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return '20:30:00';
  }

  const sanitized = value.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(sanitized)) {
    return sanitized;
  }

  if (/^\d{2}:\d{2}$/.test(sanitized)) {
    return `${sanitized}:00`;
  }

  return '20:30:00';
}

export async function POST(request: Request) {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { translationId, tafsirId, remindersEnabled, reminderTime, reminderLanguage } = body;

    if (!translationId || !tafsirId) {
      return NextResponse.json({ error: 'Missing translationId or tafsirId' }, { status: 400 });
    }

    const { error } = await supabase.from('user_preferences').upsert({
      user_id: user.id,
      translation_id: translationId,
      tafsir_id: tafsirId,
      reminders_enabled: remindersEnabled === true,
      reminder_time: parseReminderTime(reminderTime),
      reminder_language: parseReminderLanguage(reminderLanguage),
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
