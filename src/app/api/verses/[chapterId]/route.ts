import { NextResponse } from 'next/server';
import { getVerses } from '@/lib/qf-api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    const { searchParams } = new URL(request.url);
    
    const translation = searchParams.get('translation') || '203';
    const page = parseInt(searchParams.get('page') || '1', 10);
    
    const verses = await getVerses(parseInt(chapterId, 10), {
      translations: translation,
      page,
    });
    
    return NextResponse.json(verses);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}