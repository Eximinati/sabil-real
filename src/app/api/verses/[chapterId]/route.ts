import { NextResponse } from 'next/server';
import { getVerses } from '@/lib/qf-api';
import {
  normalizeApiErrorMessage,
  shouldFallbackFromError,
} from '@/lib/qf-fallbacks';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    const { searchParams } = new URL(request.url);
    
    const translation = searchParams.get('translation') || '203';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '300', 10);
    const parsedChapterId = parseInt(chapterId, 10);

    if (!Number.isFinite(parsedChapterId) || parsedChapterId <= 0) {
      return NextResponse.json(
        { error: 'Invalid chapter id', verses: [], pagination: null },
        { status: 400 }
      );
    }

    if (!Number.isFinite(page) || page <= 0 || !Number.isFinite(perPage) || perPage <= 0) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters', verses: [], pagination: null },
        { status: 400 }
      );
    }
    
    const verses = await getVerses(parsedChapterId, {
      translations: translation,
      page,
      per_page: perPage,
    });

    if (!Array.isArray(verses?.verses)) {
      return NextResponse.json(
        { verses: [], pagination: verses?.pagination || null, fallbackUsed: true },
        {
          headers: {
            'Cache-Control': 'public, max-age=120, s-maxage=120',
          },
        }
      );
    }
    
    return NextResponse.json(verses, {
      headers: {
        'Cache-Control': 'public, max-age=120, s-maxage=120',
      },
    });
  } catch (error) {
    const message = normalizeApiErrorMessage(error);
    console.error('Verses API error:', message);

    if (shouldFallbackFromError(error)) {
      return NextResponse.json(
        { verses: [], pagination: null, fallbackUsed: true, warning: message },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=120, s-maxage=120',
          },
        }
      );
    }

    return NextResponse.json(
      { error: message, verses: [], pagination: null },
      { status: 500 }
    );
  }
}
