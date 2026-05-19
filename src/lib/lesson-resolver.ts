import { fetchChapters, fetchVerse, fetchTafsirForChapter, fetchAudioForChapter, fetchHadith } from './api-cache';
import * as contentCache from './content-cache';
import {
  LessonContent,
  ResolvedLesson,
  ResolvedVerse,
  ResolvedTafsir,
  ResolvedHadith,
  VerseReference,
  TafsirReference,
  HadithReference,
  LessonResolutionOptions,
} from '@/types/lesson-content';

const verseCache = new Map<string, ResolvedVerse>();
const tafsirCache = new Map<string, ResolvedTafsir>();
const hadithCache = new Map<string, ResolvedHadith>();
const chaptersCache = new Map<number, any>();

function getVerseCacheKey(verseKey: string, translationId: number): string {
  return `${verseKey}:${translationId}`;
}

function getTafsirCacheKey(chapterId: number, verseNumber: number, tafsirId: number): string {
  return `${chapterId}:${verseNumber}:${tafsirId}`;
}

function getHadithCacheKey(collection: string, number: number): string {
  return `${collection}:${number}`;
}

export async function resolveVerse(
  verseKey: string,
  translationId: number,
  chapters: any[]
): Promise<ResolvedVerse> {
  const cacheKey = getVerseCacheKey(verseKey, translationId);
  
  if (verseCache.has(cacheKey)) {
    return verseCache.get(cacheKey)!;
  }

  const [chapterId] = verseKey.split(':');
  const chapter = chapters.find(c => c.id === parseInt(chapterId));

  try {
    const verseData = await contentCache.fetchCachedVerse(verseKey, translationId);
    const verse = verseData?.verse;

    const audioFiles = await contentCache.fetchCachedAudio(5, parseInt(chapterId));
    const audioFile = audioFiles.find((af: any) => af.verse_key === verseKey);

    const resolved: ResolvedVerse = {
      verseKey,
      textUthmani: verse?.text_uthmani || '',
      chapterName: chapter?.name_simple || `Chapter ${chapterId}`,
      translations: verse?.translations || [],
      audioUrl: audioFile?.url,
    };

    verseCache.set(cacheKey, resolved);
    return resolved;
  } catch (error) {
    return {
      verseKey,
      textUthmani: '',
      chapterName: chapter?.name_simple || `Chapter ${chapterId}`,
      translations: [],
      audioUrl: undefined,
    };
  }
}

export async function resolveTafsir(
  reference: TafsirReference,
  verseNumber: number
): Promise<ResolvedTafsir> {
  const cacheKey = getTafsirCacheKey(reference.chapterId, verseNumber, reference.tafsirId);
  
  if (tafsirCache.has(cacheKey)) {
    return tafsirCache.get(cacheKey)!;
  }

  try {
    const data = await contentCache.fetchCachedTafsir(reference.tafsirId, reference.chapterId);
    const tafsirs = data.tafsirs || data;
    const verseTafsir = tafsirs.find((t: any) => t.verse_number === verseNumber);

    const resolved: ResolvedTafsir = {
      chapterId: reference.chapterId,
      verseNumber,
      text: verseTafsir?.text || '',
    };

    tafsirCache.set(cacheKey, resolved);
    return resolved;
  } catch (error) {
    return {
      chapterId: reference.chapterId,
      verseNumber,
      text: '',
    };
  }
}

export async function resolveHadith(
  reference: HadithReference
): Promise<ResolvedHadith> {
  const cacheKey = getHadithCacheKey(reference.collection, reference.hadithNumber);
  
  if (hadithCache.has(cacheKey)) {
    return hadithCache.get(cacheKey)!;
  }

  try {
    const data = await contentCache.fetchCachedHadith(reference.collection, reference.hadithNumber);
    const hadith = data?.hadith;

    const resolved: ResolvedHadith = {
      collection: reference.collection,
      hadithNumber: reference.hadithNumber,
      name: hadith?.name || '',
      english: hadith?.english || '',
      arabic: hadith?.arabic,
    };

    hadithCache.set(cacheKey, resolved);
    return resolved;
  } catch (error) {
    return {
      collection: reference.collection,
      hadithNumber: reference.hadithNumber,
      name: '',
      english: '',
    };
  }
}

export async function resolveLesson(
  lessonContent: LessonContent,
  options: LessonResolutionOptions
): Promise<ResolvedLesson> {
  const chapters = await fetchChapters();

  const versePromises = lessonContent.verseReferences.map(vr => 
    resolveVerse(vr.verseKey, options.translationId, chapters)
  );
  const verses = await Promise.all(versePromises);

  const tafsirPromises = lessonContent.tafsirReferences.map(tr => 
    resolveTafsir(tr, lessonContent.verseReferences.find(vr => vr.chapterId === tr.chapterId)?.verseNumber || 1)
  );
  const tafsirs = await Promise.all(tafsirPromises);

  const hadithPromises = lessonContent.hadithReferences.map(hr => 
    resolveHadith(hr)
  );
  const hadiths = await Promise.all(hadithPromises);

  return {
    metadata: lessonContent.metadata,
    verses,
    tafsirs,
    hadiths,
  };
}

export function createLessonFromDb(
  dbLesson: any,
  verseKeys: string[]
): LessonContent {
  const verseReferences: VerseReference[] = verseKeys.map(vk => {
    const [chapterId, verseNumber] = vk.split(':');
    return {
      verseKey: vk,
      chapterId: parseInt(chapterId),
      verseNumber: parseInt(verseNumber),
    };
  });

  const tafsirReferences: TafsirReference[] = [];
  const hadithReferences: HadithReference[] = [];

  if (dbLesson.hadith_collection && dbLesson.hadith_number) {
    hadithReferences.push({
      collection: dbLesson.hadith_collection,
      hadithNumber: dbLesson.hadith_number,
    });
  }

  return {
    metadata: {
      id: dbLesson.id,
      dayNumber: dbLesson.day_number,
      title: dbLesson.title,
      subtitle: dbLesson.subtitle,
      topic: dbLesson.topic,
      description: dbLesson.description,
      estimatedMinutes: dbLesson.estimated_minutes,
      isPublished: dbLesson.is_published,
    },
    fragments: [],
    verseReferences,
    audioReferences: verseKeys.map(vk => ({
      verseKey: vk,
      reciterId: 5,
    })),
    tafsirReferences,
    hadithReferences,
  };
}

export function clearContentCache(): void {
  verseCache.clear();
  tafsirCache.clear();
  hadithCache.clear();
  contentCache.clearAllCaches();
}

export function getCacheStats() {
  return {
    verses: verseCache.size,
    tafsirs: tafsirCache.size,
    hadiths: hadithCache.size,
    contentCache: contentCache.getCacheStats(),
  };
}