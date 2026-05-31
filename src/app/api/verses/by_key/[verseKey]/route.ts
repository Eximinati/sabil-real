import { NextResponse } from 'next/server';
import { getVerses } from '@/lib/qf-api';
import {
  DEFAULT_TRANSLATION_ID,
  normalizeApiErrorMessage,
  shouldFallbackFromError,
} from '@/lib/qf-fallbacks';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ verseKey: string }> }
) {
  try {
    const { verseKey } = await params;
    const { searchParams } = new URL(request.url);
    const translationId = parseInt(
      searchParams.get('translation') || String(DEFAULT_TRANSLATION_ID),
      10
    );

    if (!Number.isFinite(translationId) || translationId <= 0) {
      return NextResponse.json({ error: 'Invalid translation id', verse: null }, { status: 400 });
    }
    
    const [chapterIdStr, verseNumberStr] = verseKey.split(':');
    const chapterId = parseInt(chapterIdStr, 10);
    const verseNumber = parseInt(verseNumberStr, 10);
    
    if (!chapterId || !verseNumber) {
      return NextResponse.json({ error: 'Invalid verse key', verse: null }, { status: 400 });
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
        return NextResponse.json({ error: 'Verse not found', verse: null }, { status: 404 });
      }
      
      return NextResponse.json({ verse: verseFromPage1 });
    }
    
    return NextResponse.json({ verse });
  } catch (error) {
    const message = normalizeApiErrorMessage(error);
    console.error('Error fetching verse by key:', message);

    if (shouldFallbackFromError(error)) {
      return NextResponse.json(
        {
          verse: null,
          fallbackUsed: true,
          warning: message,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
