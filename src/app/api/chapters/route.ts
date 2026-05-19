import { NextResponse } from 'next/server';
import { getChapters } from '@/lib/qf-api';

export const dynamic = 'force-static';
export const revalidate = 86400;
export const fetchCache = 'force-cache';

export async function GET() {
  try {
    const chapters = await getChapters();
    return NextResponse.json(chapters, {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}