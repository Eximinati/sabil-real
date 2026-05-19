import { NextResponse } from 'next/server';
import { getVerses } from '@/lib/qf-api';
import { getApiUrl } from '@/lib/api-url';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const verseKeys = searchParams.get('verse_keys')?.split(',') || [];
    const translationId = parseInt(searchParams.get('translation') || '203', 10);
    const reciterId = parseInt(searchParams.get('reciter') || '5', 10);

    if (verseKeys.length === 0) {
      return NextResponse.json({ verses: [] });
    }

    const chapterGroups = new Map<number, string[]>();
    
    for (const vk of verseKeys) {
      const [chapterId] = vk.split(':');
      const chId = parseInt(chapterId, 10);
      if (!chapterGroups.has(chId)) {
        chapterGroups.set(chId, []);
      }
      chapterGroups.get(chId)!.push(vk);
    }

    const versesResult: any[] = [];
    
    const versePromises = Array.from(chapterGroups.entries()).map(async ([chapterId, keys]) => {
      const firstVerseNum = Math.min(...keys.map(k => parseInt(k.split(':')[1], 10)));
      const lastVerseNum = Math.max(...keys.map(k => parseInt(k.split(':')[1], 10)));
      const startPage = Math.floor((firstVerseNum - 1) / 50) + 1;
      const endPage = Math.ceil(lastVerseNum / 50);
      
      const pagesData: any[] = [];
      for (let page = startPage; page <= endPage; page++) {
        const data = await getVerses(chapterId, {
          translations: translationId.toString(),
          page,
          per_page: 50,
        });
        pagesData.push(...(data.verses || []));
      }
      
      return { chapterId, verses: pagesData, keys };
    });

    const chapterResults = await Promise.all(versePromises);

    const allChapterIds = [...new Set(chapterResults.map(r => r.chapterId))];
    
    let audioFiles: any[] = [];
    try {
      const audioPromises = allChapterIds.map(async (chapterId) => {
        const audioRes = await fetch(getApiUrl(`/audio/${reciterId}/${chapterId}`));
        if (audioRes.ok) {
          const audioData = await audioRes.json();
          return audioData.audio_files || [];
        }
        return [];
      });
      
      const audioResults = await Promise.all(audioPromises);
      audioFiles = audioResults.flat();
    } catch (e) {
      console.error('Audio fetch error:', e);
    }

    for (const { chapterId, verses, keys } of chapterResults) {
      for (const vk of keys) {
        const verse = verses.find((v: any) => v.verse_key === vk);
        const audioFile = audioFiles.find((af: any) => af.verse_key === vk);
        
        versesResult.push({
          verse: verse || null,
          chapterName: `Chapter ${chapterId}`,
          verseKey: vk,
          audioUrl: audioFile?.url,
        });
      }
    }

    return NextResponse.json({ verses: versesResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching verses:', message);
    return NextResponse.json({ error: message, verses: [] }, { status: 500 });
  }
}