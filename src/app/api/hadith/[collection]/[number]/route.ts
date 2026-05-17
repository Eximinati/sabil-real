import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ collection: string; number: string }> }
) {
  try {
    const { collection, number } = await params;
    const collectionId = parseInt(number, 10);
    
    if (!collectionId || collectionId < 1) {
      return NextResponse.json({ error: 'Invalid hadith number' }, { status: 400 });
    }
    
    const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${collection}/${number}.json`;
    
    const res = await fetch(url, { next: { revalidate: 86400 } });
    
    if (!res.ok) {
      return NextResponse.json(
        { error: `Hadith not found: ${collection} ${number}` }, 
        { status: 404 }
      );
    }
    
    const data = await res.json();
    
    console.log('Full hadith data:', JSON.stringify(data, null, 2));
    
    const hadithItem = data.hadiths?.[0];
    
    const englishText = 
      hadithItem?.text ?? 
      hadithItem?.body ?? 
      hadithItem?.english ?? 
      hadithItem?.hadith ?? 
      null;
    
    return NextResponse.json({
      hadith: {
        number: hadithItem?.hadithnumber ?? parseInt(number),
        arabic: hadithItem?.arab ?? null,
        english: englishText || null,
        collection: collection,
        name: data.metadata?.name ?? getCollectionName(collection),
        section: Object.values(data.metadata?.section ?? {})[0] ?? null,
      }
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