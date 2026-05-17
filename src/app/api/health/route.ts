import { NextResponse } from 'next/server';
import { getChapters } from '@/lib/qf-api';
import { getQFToken } from '@/lib/qf-token';

export async function GET() {
  try {
    const token = await getQFToken();
    
    const chapters = await getChapters();
    const firstChapter = chapters[0];
    
    return NextResponse.json({
      status: 'ok',
      token_acquired: true,
      test_chapter: firstChapter?.name_simple || 'Unknown',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { status: 'error', message },
      { status: 500 }
    );
  }
}