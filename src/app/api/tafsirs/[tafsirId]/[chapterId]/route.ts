import { NextResponse } from 'next/server';
import { getTafsirForSurah } from '@/lib/qf-api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tafsirId: string; chapterId: string }> }
) {
  try {
    const { tafsirId, chapterId } = await params;
    const tafsirData = await getTafsirForSurah(parseInt(tafsirId, 10), parseInt(chapterId, 10));
    console.log('Tafsir API response:', JSON.stringify(tafsirData).slice(0, 500));
    return NextResponse.json(tafsirData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}