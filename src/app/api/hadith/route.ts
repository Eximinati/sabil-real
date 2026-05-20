import { NextResponse } from 'next/server';
import { fetchCachedHadith } from '@/lib/content-cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const number = searchParams.get('number');

    if (!collection || !number) {
      return NextResponse.json({ error: 'Missing collection or number' }, { status: 400 });
    }

    const hadithData = await fetchCachedHadith(collection, parseInt(number, 10));

    return NextResponse.json({ hadith: hadithData.hadith || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching hadith:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}