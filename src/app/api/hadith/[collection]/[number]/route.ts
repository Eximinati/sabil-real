import { NextResponse } from 'next/server';

const SUPPORTED_COLLECTIONS = new Set([
  'bukhari',
  'muslim',
  'abudawud',
  'tirmidhi',
  'nasai',
  'ibnmajah',
  'malik',
]);

function pickFirstText(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function decodeBrokenUnicode(value: string): string {
  const replacementChar = String.fromCharCode(65533);
  const questionMarkCount = (value.match(/\?/g) || []).length;
  const hasReplacementChar = value.includes(replacementChar);
  const hasHeavyCorruption = questionMarkCount > 20 && questionMarkCount / Math.max(1, value.length) > 0.2;

  if (!hasReplacementChar && !hasHeavyCorruption) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(value.split('').map((char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes).trim();

    if (!decoded) {
      return value;
    }

    const hasNonAscii = Array.from(decoded).some((char) => char.charCodeAt(0) > 127);
    return hasNonAscii ? decoded : value;
  } catch {
    return value;
  }
}

async function fetchEditionHadith(collection: string, number: string, edition: string) {
  const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${edition}-${collection}/${number}.json`;
  const response = await fetch(url, { next: { revalidate: 86400 } });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function resolveSection(metadata: any): string | null {
  return pickFirstText(
    ...(metadata?.section ? Object.values(metadata.section) : []),
    metadata?.section,
    metadata?.book,
    metadata?.chapter
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ collection: string; number: string }> }
) {
  try {
    const { collection, number } = await params;
    const normalizedCollection = collection.trim().toLowerCase();
    const { searchParams } = new URL(request.url);
    const requestedLanguage = searchParams.get('lang');
    const collectionId = parseInt(number, 10);

    if (!SUPPORTED_COLLECTIONS.has(normalizedCollection)) {
      return NextResponse.json({ error: 'Unsupported hadith collection' }, { status: 400 });
    }

    if (!collectionId || collectionId < 1) {
      return NextResponse.json({ error: 'Invalid hadith number' }, { status: 400 });
    }

    const langHint =
      requestedLanguage === 'english' || requestedLanguage === 'urdu'
        ? requestedLanguage
        : null;

    const [englishData, urduData] = await Promise.all([
      fetchEditionHadith(normalizedCollection, number, 'eng'),
      fetchEditionHadith(normalizedCollection, number, 'urd'),
    ]);

    if (!englishData && !urduData) {
      return NextResponse.json(
        {
          error: `Hadith not found: ${normalizedCollection} ${number}`,
          fallback: {
            collection: normalizedCollection,
            number: collectionId,
            requested_language: langHint,
          },
        },
        { status: 404 }
      );
    }

    const englishItem = englishData?.hadiths?.[0];
    const urduItem = urduData?.hadiths?.[0];
    const baseItem = englishItem || urduItem || {};
    const metadata = englishData?.metadata || urduData?.metadata || {};

    const englishText = pickFirstText(
      englishItem?.text,
      englishItem?.body,
      englishItem?.english,
      englishItem?.hadith
    );

    const urduRawText = pickFirstText(
      urduItem?.text,
      urduItem?.body,
      urduItem?.urdu,
      urduItem?.hadith
    );

    const urduText = urduRawText ? decodeBrokenUnicode(urduRawText) : null;
    const resolvedLanguage =
      requestedLanguage === 'urdu'
        ? (urduText ? 'urdu' : englishText ? 'english' : null)
        : requestedLanguage === 'english'
          ? (englishText ? 'english' : urduText ? 'urdu' : null)
          : null;

    return NextResponse.json({
      hadith: {
        number: baseItem?.hadithnumber ?? parseInt(number, 10),
        arabic: pickFirstText(englishItem?.arab, urduItem?.arab),
        english: englishText || null,
        urdu: urduText,
        collection: normalizedCollection,
        name: metadata?.name ?? getCollectionName(normalizedCollection),
        section: resolveSection(metadata),
        available_languages: [
          ...(englishText ? ['english'] : []),
          ...(urduText ? ['urdu'] : []),
        ],
        requested_language: langHint,
        resolved_language: resolvedLanguage,
      },
      fallback: {
        collection: normalizedCollection,
        number: collectionId,
        requested_language: langHint,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getCollectionName(collection: string): string {
  const names: Record<string, string> = {
    bukhari: 'Sahih al-Bukhari',
    muslim: 'Sahih Muslim',
    abudawud: 'Sunan Abu Dawud',
    tirmidhi: "Jami' at-Tirmidhi",
    nasai: "Sunan an-Nasa'i",
    ibnmajah: 'Sunan Ibn Majah',
    malik: 'Muwatta Malik',
  };

  return names[collection] ?? collection;
}
