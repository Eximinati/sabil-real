import { NextResponse } from 'next/server';
import { getVerses } from '@/lib/qf-api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ verseKey: string }> }
) {
  try {
    const { verseKey } = await params;
    const { searchParams } = new URL(request.url);
    const translationId = parseInt(searchParams.get('translation') || '203', 10);
    
    const [chapterIdStr, verseNumberStr] = verseKey.split(':');
    const chapterId = parseInt(chapterIdStr, 10);
    const verseNumber = parseInt(verseNumberStr, 10);
    
    if (!chapterId || !verseNumber) {
      return NextResponse.json({ error: 'Invalid verse key' }, { status: 400 });
    }
    
    const page = Math.ceil(verseNumber / 50);
    
    const data = await getVerses(chapterId, {
      translations: translationId.toString(),
      page,
      per_page: 50,
    });
    
    const verse = data.verses?.find(v => v.verse_key === verseKey);
    
    if (!verse) {
      const page1Data = await getVerses(chapterId, {
        translations: translationId.toString(),
        page: 1,
        per_page: 50,
      });
      const verseFromPage1 = page1Data.verses?.find(v => v.verse_key === verseKey);
      
      if (!verseFromPage1) {
        return NextResponse.json({ error: 'Verse not found' }, { status: 404 });
      }
      
      return NextResponse.json({ verse: verseFromPage1 });
    }
    
    return NextResponse.json({ verse });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching verse by key:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}