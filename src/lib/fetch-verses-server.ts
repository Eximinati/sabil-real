import { getApiUrl } from './api-url';

interface VerseData {
  verse_key: string;
  text_uthmani: string;
  chapter_name?: string;
  translations?: Array<{ resource_name: string; text: string }>;
  audio_url?: string;
}

export async function fetchVersesForBlocks(
  verseKeys: string[],
  translationId: number
): Promise<Record<string, VerseData>> {
  if (verseKeys.length === 0) return {};

  const unique = [...new Set(verseKeys)];
  const url = getApiUrl(`/verses?verse_keys=${unique.join(',')}&translation=${translationId}&include_audio=false&verses_only=true`);
  const res = await fetch(url, { next: { revalidate: 300 } });
  const data = await res.json();

  const map: Record<string, VerseData> = {};
  for (const item of data.verses || []) {
    map[item.verseKey] = {
      verse_key: item.verseKey,
      text_uthmani: item.verse?.text_uthmani || '',
      chapter_name: item.chapterName,
      translations: item.verse?.translations?.[0]?.text
        ? [{ resource_name: '', text: item.verse.translations[0].text }]
        : undefined,
      audio_url: item.audioUrl,
    };
  }
  return map;
}
