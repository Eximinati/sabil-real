import { NextResponse } from 'next/server';
import { getHadiths } from '@/lib/qf-api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ verseKey: string }> }
) {
  try {
    const { verseKey } = await params;
    const data = await getHadiths(verseKey);
    console.log('Hadith API response:', JSON.stringify(data).slice(0, 500));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Hadith API error:', error);
    return NextResponse.json({ hadiths: [], has_more: false, page: 1, limit: 5 });
  }
}