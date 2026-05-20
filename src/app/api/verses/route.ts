import { NextResponse } from 'next/server';
import { getVerses, getChapterRecitationAudio } from '@/lib/qf-api';

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
    
    const pagePromises: Promise<{ chapterId: number; verses: any[]; keys: string[] }>[] = [];
    
    for (const [chapterId, keys] of chapterGroups.entries()) {
      const firstVerseNum = Math.min(...keys.map(k => parseInt(k.split(':')[1], 10)));
      const lastVerseNum = Math.max(...keys.map(k => parseInt(k.split(':')[1], 10)));
      const startPage = Math.floor((firstVerseNum - 1) / 50) + 1;
      const endPage = Math.ceil(lastVerseNum / 50);
      
      const chapterPages = startPage === endPage
        ? [getVerses(chapterId, { translations: translationId.toString(), page: startPage, per_page: 50 }).then(d => ({ page: startPage, data: d }))]
        : Array.from({ length: endPage - startPage + 1 }, (_, i) => {
            const page = startPage + i;
            return getVerses(chapterId, { translations: translationId.toString(), page, per_page: 50 }).then(d => ({ page, data: d }));
          });
      
      pagePromises.push(
        Promise.all(chapterPages).then(results => ({
          chapterId,
          verses: results.sort((a, b) => a.page - b.page).flatMap(r => r.data.verses || []),
          keys,
        }))
      );
    }
    
    const chapterResults = await Promise.all(pagePromises);

    const allChapterIds = [...new Set(chapterResults.map(r => r.chapterId))];
    
    let audioFiles: any[] = [];
    try {
      const audioPromises = allChapterIds.map(chapterId =>
        getChapterRecitationAudio(reciterId, chapterId)
          .then(files => files.map(f => ({ ...f, chapterId })))
          .catch(() => [])
      );
      
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