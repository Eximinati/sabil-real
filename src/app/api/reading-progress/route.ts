import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const surahId = searchParams.get('surah_id');

    let query = supabase
      .from('reading_positions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (surahId) {
      query = query.eq('surah_id', parseInt(surahId));
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
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { surah_id, verse_number, scroll_position } = await request.json();

    if (!surah_id || verse_number === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: position, error } = await supabase
      .from('reading_positions')
      .upsert({
        user_id: user.id,
        surah_id,
        verse_number,
        scroll_position: scroll_position || 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,surah_id' })
      .select()
      .single();

    if (error) throw error;

    const MAX_POSITIONS = 25;
    const { data: allPositions } = await supabase
      .from('reading_positions')
      .select('id, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (allPositions && allPositions.length > MAX_POSITIONS) {
      const idsToDelete = allPositions
        .slice(MAX_POSITIONS)
        .map(p => p.id);
      
      await supabase
        .from('reading_positions')
        .delete()
        .in('id', idsToDelete);
    }

    return NextResponse.json({ progress: position, positions: [position] });
  } catch (error) {
    console.error('Error updating reading progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const surahId = searchParams.get('surah_id');

    if (!surahId) {
      return NextResponse.json({ error: 'Missing surah_id parameter' }, { status: 400 });
    }

    const { error } = await supabase
      .from('reading_positions')
      .delete()
      .eq('user_id', user.id)
      .eq('surah_id', parseInt(surahId));

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reading position:', error);
    return NextResponse.json({ error: 'Failed to delete position' }, { status: 500 });
  }
}