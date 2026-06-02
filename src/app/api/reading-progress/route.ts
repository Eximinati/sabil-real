import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf';

const MAX_POSITIONS = 25;

function parsePositiveIntParam(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseIntParamStrict(value: string | null): number | null {
  if (value === null) return null;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parsePositiveIntParam(searchParams.get('limit'), 10);
    const surahId = parseIntParamStrict(searchParams.get('surah_id'));

    let query = supabase
      .from('reading_positions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (surahId !== null) {
      query = query.eq('surah_id', surahId);
    }

    const { data: positions, error } = await query;

    if (error) throw error;

    const { data: legacyProgress } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const progress = positions && positions.length > 0 
      ? positions[0] 
      : legacyProgress || null;

    const allPositions = positions || [];

    return NextResponse.json({ 
      progress,
      positions: allPositions,
      hasLegacyData: !!legacyProgress && (!positions || positions.length === 0)
    });
  } catch (error) {
    console.error('Error fetching reading progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!validateCsrf(request).valid) {
    return csrfErrorResponse();
  }

  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { surah_id, verse_number, scroll_position } = body;

    const parsedSurahId = parseInt(surah_id, 10);
    const parsedVerseNumber = parseInt(verse_number, 10);

    if (isNaN(parsedSurahId) || isNaN(parsedVerseNumber)) {
      return NextResponse.json({ error: 'Invalid surah_id or verse_number' }, { status: 400 });
    }

    if (!parsedSurahId || parsedVerseNumber === undefined || isNaN(parsedVerseNumber)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const safeScrollPosition = typeof scroll_position === 'number'
      ? Math.floor(scroll_position)
      : parseInt(scroll_position, 10) || 0;

    const { data: position, error } = await supabase
      .from('reading_positions')
      .upsert({
        user_id: user.id,
        surah_id: parsedSurahId,
        verse_number: parsedVerseNumber,
        scroll_position: safeScrollPosition,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,surah_id' })
      .select()
      .single();

    if (error) throw error;

    const { data: allPositions } = await supabase
      .from('reading_positions')
      .select('id, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (allPositions && allPositions.length > MAX_POSITIONS) {
      const idsToDelete = allPositions
        .slice(MAX_POSITIONS)
        .map(p => p.id);
      
      const { error: deleteError } = await supabase
        .from('reading_positions')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('Reading position cleanup error:', deleteError);
      }
    }

    const { data: refreshedPositions } = await supabase
      .from('reading_positions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(MAX_POSITIONS);

    return NextResponse.json({
      progress: position,
      positions: refreshedPositions || [position],
    });
  } catch (error) {
    console.error('Error updating reading progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!validateCsrf(request).valid) {
    return csrfErrorResponse();
  }

  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const surahId = parseIntParamStrict(searchParams.get('surah_id'));

    if (surahId === null) {
      return NextResponse.json({ error: 'Missing or invalid surah_id parameter' }, { status: 400 });
    }

    const { error } = await supabase
      .from('reading_positions')
      .delete()
      .eq('user_id', user.id)
      .eq('surah_id', surahId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reading position:', error);
    return NextResponse.json({ error: 'Failed to delete position' }, { status: 500 });
  }
}