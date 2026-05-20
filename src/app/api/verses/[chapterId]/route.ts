import { NextResponse } from 'next/server';
import { getVerses } from '@/lib/qf-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    const { searchParams } = new URL(request.url);
    
    const translation = searchParams.get('translation') || '203';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '300', 10);
    
    const verses = await getVerses(parseInt(chapterId, 10), {
      translations: translation,
      page,
      per_page: perPage,
    });
    
    return NextResponse.json(verses, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Verses API error:', message);
    return NextResponse.json(
      { error: message, verses: [], pagination: null },
      { status: 500 }
    );
  }
}