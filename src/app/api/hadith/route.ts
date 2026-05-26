import { NextResponse } from 'next/server';
import { fetchCachedHadith, fetchCachedHadithByLanguage } from '@/lib/content-cache';
import { normalizeApiErrorMessage } from '@/lib/qf-fallbacks';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection')?.trim().toLowerCase();
    const number = searchParams.get('number');
    const language = searchParams.get('lang');

    if (!collection || !number) {
      return NextResponse.json({ error: 'Missing collection or number' }, { status: 400 });
    }

    const parsedNumber = parseInt(number, 10);
    if (!Number.isFinite(parsedNumber) || parsedNumber <= 0) {
      return NextResponse.json({ error: 'Invalid hadith number' }, { status: 400 });
    }

    const hadithData =
      language === 'english' || language === 'urdu'
        ? await fetchCachedHadithByLanguage(collection, parsedNumber, language)
        : await fetchCachedHadith(collection, parsedNumber);

    if (!hadithData?.hadith) {
      return NextResponse.json(
        {
          hadith: null,
          fallback: {
            collection,
            number: parsedNumber,
            requested_language:
              language === 'english' || language === 'urdu' ? language : null,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      hadith: hadithData.hadith,
      fallback: {
        collection,
        number: parsedNumber,
        requested_language:
          language === 'english' || language === 'urdu' ? language : null,
      },
    });
  } catch (error) {
    const message = normalizeApiErrorMessage(error);
    console.error('Error fetching hadith:', message);
    return NextResponse.json({
      error: message,
      hadith: null,
    }, { status: 500 });
  }
}
