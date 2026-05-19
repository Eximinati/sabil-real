import { getApiUrl } from './api-url';

const CACHE_CONFIG = {
  chapters: { revalidate: 86400 }, // 24 hours - static data
  translations: { revalidate: 3600 }, // 1 hour
  tafsirs: { revalidate: 3600 }, // 1 hour  
  tafsirContent: { revalidate: 3600 }, // 1 hour
  audio: { revalidate: 86400 }, // 24 hours - reciter config rarely changes
  chaptersDetail: { revalidate: 43200 }, // 12 hours
  verses: { revalidate: 60 }, // 1 minute - verse content cached briefly
  hadithCollections: { revalidate: 86400 }, // 24 hours
  hadith: { revalidate: 300 }, // 5 minutes
};

function getCacheConfig(key: keyof typeof CACHE_CONFIG) {
  return CACHE_CONFIG[key];
}

export async function fetchChapters() {
  const res = await fetch(getApiUrl('/chapters'), {
    next: { revalidate: CACHE_CONFIG.chapters.revalidate }
  });
  if (!res.ok) throw new Error('Failed to fetch chapters');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.chapters || []);
}

export async function fetchChapterById(chapterId: number) {
  const chapters = await fetchChapters();
  return chapters.find((c: any) => c.id === chapterId);
}

export async function fetchTranslations() {
  const res = await fetch(getApiUrl('/translations'), {
    next: { revalidate: CACHE_CONFIG.translations.revalidate }
  });
  if (!res.ok) throw new Error('Failed to fetch translations');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.translations || []);
}

export async function fetchTafsirs() {
  const res = await fetch(getApiUrl('/tafsirs'), {
    next: { revalidate: CACHE_CONFIG.tafsirs.revalidate }
  });
  if (!res.ok) throw new Error('Failed to fetch tafsirs');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.tafsirs || []);
}

export async function fetchTafsirForChapter(tafsirId: number, chapterId: number) {
  const res = await fetch(getApiUrl(`/tafsirs/${tafsirId}/${chapterId}`), {
    next: { revalidate: CACHE_CONFIG.tafsirContent.revalidate }
  });
  if (!res.ok) throw new Error('Failed to fetch tafsir');
  return res.json();
}

export async function fetchAudioForChapter(reciterId: number, chapterId: number) {
  const res = await fetch(getApiUrl(`/audio/${reciterId}/${chapterId}`), {
    next: { revalidate: CACHE_CONFIG.audio.revalidate }
  });
  if (!res.ok) throw new Error('Failed to fetch audio');
  const data = await res.json();
  return data.audio_files || [];
}

export async function fetchVerse(verseKey: string, translationId: number = 203) {
  const res = await fetch(
    getApiUrl(`/verses/by_key/${verseKey}?translation=${translationId}`),
    { next: { revalidate: CACHE_CONFIG.verses.revalidate } }
  );
  if (!res.ok) throw new Error('Failed to fetch verse');
  return res.json();
}

export async function fetchVerses(verseKeys: string[], translationId: number = 203) {
  const promises = verseKeys.map(key => fetchVerse(key, translationId));
  return Promise.all(promises);
}

export async function fetchHadithCollections() {
  const res = await fetch(getApiUrl('/hadith/collections'), {
    next: { revalidate: CACHE_CONFIG.hadithCollections.revalidate }
  });
  if (!res.ok) throw new Error('Failed to fetch hadith collections');
  return res.json();
}

export async function fetchHadith(collection: string, number: number) {
  const res = await fetch(getApiUrl(`/hadith/${collection}/${number}`), {
    next: { revalidate: CACHE_CONFIG.hadith.revalidate }
  });
  if (!res.ok) throw new Error('Failed to fetch hadith');
  return res.json();
}

export async function fetchVersesWithAudio(
  verseKeys: string[], 
  translationId: number,
  reciterId: number
) {
  const chapterIds = [...new Set(verseKeys.map(vk => vk.split(':')[0]))];
  
  const [chapters, audioDataArray, versesData] = await Promise.all([
    fetchChapters(),
    Promise.all(chapterIds.map(chId => fetchAudioForChapter(reciterId, parseInt(chId)))),
    Promise.all(verseKeys.map(key => fetchVerse(key, translationId)))
  ]);

  const audioFilesMap: Record<string, any[]> = {};
  chapterIds.forEach((chId, idx) => {
    audioFilesMap[chId] = audioDataArray[idx] || [];
  });

  return versesData.map((verseData, idx) => {
    const verseKey = verseKeys[idx];
    const [chapterId] = verseKey.split(':');
    const chapter = chapters.find((c: any) => c.id === parseInt(chapterId));
    const audioFile = audioFilesMap[chapterId]?.find((af: any) => af.verse_key === verseKey);
    
    return {
      verse: verseData?.verse || null,
      chapterName: chapter?.name_simple || `Chapter ${chapterId}`,
      verseKey: verseKey,
      audioUrl: audioFile?.url
    };
  });
}

export { CACHE_CONFIG };